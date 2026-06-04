#!/usr/bin/env ruby
# frozen_string_literal: true

# =============================================================================
# Manual check: podspec SPM <-> CocoaPods parity for the AppsFlyer native SDK
# =============================================================================
#
# Run manually before releasing the (early-adopter) SPM-native-SDK feature, or
# whenever the native SDK pin changes:
#
#   ruby scripts/spm/verify_podspec_spm_parity.rb
#
# Asserts the statically-checkable SPM <-> CocoaPods parity invariants for the
# AppsFlyer native SDK. It does NOT build anything and is NOT wired into CI
# (the feature is opt-in/early-adopter; parity is verified by hand for now).
# Feature overview: Docs/early-adopter/RN_NativeSDK_SPM.md
#
# Checks:
#   1. Core SPM URL points to AppsFlyerFramework-Dynamic (never a -Static package);
#      PurchaseConnector SPM URL points to PurchaseConnector-Dynamic.
#   2. No SPM URL references a -Static package.
#   3. The version used for each spm_dependency matches the corresponding
#      s.dependency version. Parity is expressed by both referencing the SAME
#      top-of-file constant (APPSFLYER_IOS_SDK_VERSION / APPSFLYER_PURCHASE_CONNECTOR_VERSION).
#      A hardcoded version literal in any dependency line that diverges from the
#      constant is a failure.
#
# Design: the podspec is Ruby, but we deliberately DO NOT `Pod::Spec.new` it
# (no CocoaPods load, no side effects, runs anywhere with plain ruby). We
# regex-extract the constants and the dependency / spm_dependency lines.
#
# Graceful degradation: a podspec with NO spm_dependency lines is valid (pod-only,
# legacy state) -> parity trivially holds, exit 0 with an informational note.
#
# Exit codes: 0 = parity holds (or pod-only). Non-zero = mismatch (message printed).
#
# TODO(spm-release-smoke): This guard is statically-checkable invariants only.
# The expensive build/smoke matrix (dynamic-frameworks build, duplicate-symbol
# linkage, New-Architecture in SPM mode, behavioral deep-link/conversion/logEvent
# parity, core-header-resolution) lives in the separate release-blocking smoke job
# (not here). Do NOT add those here; this job must stay fast.
# =============================================================================

DEFAULT_PODSPEC = File.expand_path('../../react-native-appsflyer.podspec', __dir__)

EXPECTED_CONSTANTS = {
  'APPSFLYER_SPM_CORE_DYNAMIC_URL' =>
    'https://github.com/AppsFlyerSDK/AppsFlyerFramework-Dynamic',
  'APPSFLYER_SPM_PURCHASE_CONNECTOR_DYNAMIC_URL' =>
    'https://github.com/AppsFlyerSDK/PurchaseConnector-Dynamic'
}.freeze

CORE_VERSION_CONST = 'APPSFLYER_IOS_SDK_VERSION'
PC_VERSION_CONST   = 'APPSFLYER_PURCHASE_CONNECTOR_VERSION'

class ParityError < StandardError; end

# Extracts `NAME = 'value'` / `NAME = "value"` top-level constant assignments.
def extract_constants(source)
  consts = {}
  source.each_line do |line|
    next unless (m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(['"])(.*?)\2/))

    consts[m[1]] = m[3]
  end
  consts
end

# Returns the bare argument text of each `spm_dependency(...)` CALL as a string.
# Matches only a real invocation: the token must be `spm_dependency` immediately
# followed by `(`, NOT preceded by an identifier char (so `af_spm_dependency_...`
# is skipped) and NOT the bare `defined?(spm_dependency)` reference (no `(` after).
# Handles multi-line calls by scanning from the opening paren to its match.
def extract_spm_dependency_args(source)
  calls = []
  source.to_enum(:scan, /(?<![A-Za-z0-9_])spm_dependency\(/).each do
    paren = Regexp.last_match.end(0) - 1 # index of the '('
    depth = 0
    i = paren
    while i < source.length
      depth += 1 if source[i] == '('
      depth -= 1 if source[i] == ')'
      break if depth.zero?

      i += 1
    end
    calls << source[(paren + 1)...i]
  end
  calls
end

# Returns array of [pod_name, version_token] for every `s.dependency '...'` line
# that pins a version. version_token is the raw text (literal or constant ref).
def extract_pod_dependencies(source)
  deps = []
  source.each_line do |line|
    next unless (m = line.match(/\.dependency\s+(['"])(.*?)\1\s*,\s*(.+?)\s*$/))

    deps << [m[2], m[3].sub(/#.*$/, '').strip]
  end
  deps
end

# Extracts the value of `key:` from a keyword-argument string. The value runs to
# the next top-level comma — commas inside (), [], {} or quotes don't terminate it
# (so `requirement: { kind: 'x', version: V }` and `af_exact(V)` both parse whole).
def parse_kw(args, key)
  start = args =~ /(?<![A-Za-z0-9_])#{Regexp.escape(key)}\s*:\s*/
  return nil if start.nil?

  i = start + Regexp.last_match(0).length
  depth = 0
  quote = nil
  value = +''
  while i < args.length
    c = args[i]
    if quote
      quote = nil if c == quote
    elsif c == '"' || c == "'"
      quote = c
    elsif '([{'.include?(c)
      depth += 1
    elsif ')]}'.include?(c)
      break if depth.zero?

      depth -= 1
    elsif c == ',' && depth.zero?
      break
    end
    value << c
    i += 1
  end
  value.strip.empty? ? nil : value.strip
end

# Resolves a token to a string value: a quoted literal yields its inner text; a
# known constant name yields its value; anything else is returned unchanged.
def resolve_value(token, consts)
  return nil if token.nil?

  if (lit = token.match(/\A(['"])(.*?)\1\z/))
    lit[2]
  elsif consts.key?(token)
    consts[token]
  else
    token
  end
end

# A version token "matches" a constant if it IS that constant reference, or if
# it is a literal whose value equals the constant's value. A divergent literal
# (different value, or a different constant) fails parity.
def version_token_matches_constant?(token, const_name, const_value)
  return true if token == const_name

  if (lit = token.match(/\A(['"])(.*?)\1\z/))
    return lit[2] == const_value
  end

  # References some other constant -> not the canonical one; treat as mismatch
  # unless it resolves to the same value (we only know our own constants).
  false
end

def run(podspec_path)
  unless File.file?(podspec_path)
    raise ParityError, "podspec not found: #{podspec_path}"
  end

  source = File.read(podspec_path)
  consts = extract_constants(source)
  spm_calls = extract_spm_dependency_args(source)

  if spm_calls.empty?
    puts "[spm-parity] No spm_dependency calls found in #{File.basename(podspec_path)}."
    puts '[spm-parity] Pod-only (legacy) podspec — SPM parity trivially holds. PASS.'
    return
  end

  errors = []

  # --- URLs: must use the canonical Dynamic constants, and no -Static anywhere.
  EXPECTED_CONSTANTS.each do |name, expected_url|
    actual = consts[name]
    if actual.nil?
      errors << "Constant #{name} is not defined (expected #{expected_url})."
    elsif actual != expected_url
      errors << "Constant #{name} = #{actual.inspect}, expected #{expected_url.inspect}."
    end
  end

  consts.each do |name, value|
    next unless name.start_with?('APPSFLYER_SPM_') && name.end_with?('_URL')

    errors << "SPM URL constant #{name} references a -Static package: #{value.inspect}." if value =~ /-Static\b/
  end

  spm_calls.each do |args|
    url = resolve_value(parse_kw(args, 'url'), consts)
    errors << "spm_dependency uses a -Static URL: #{url.inspect}." if url && url =~ /-Static/
    products = parse_kw(args, 'products')
    errors << "spm_dependency products reference a -Static product: #{products.inspect}." if products && products =~ /-Static/
  end

  # --- Version parity: each spm_dependency requirement must reference the same
  #     constant as the matching s.dependency pod line.
  pod_deps = extract_pod_dependencies(source)

  # Default AND Strict core variants both pin APPSFLYER_IOS_SDK_VERSION — check every one.
  core_pods = pod_deps.select { |name, _| name == 'AppsFlyerFramework' || name == 'AppsFlyerFramework/Strict' }
  pc_pod    = pod_deps.find   { |name, _| name == 'PurchaseConnector' }

  core_pods.each do |name, version|
    next if version_token_matches_constant?(version, CORE_VERSION_CONST, consts[CORE_VERSION_CONST])

    errors << "Pod dependency '#{name}' pins #{version.inspect}, " \
              "expected reference to #{CORE_VERSION_CONST} (= #{consts[CORE_VERSION_CONST].inspect})."
  end
  if pc_pod && !version_token_matches_constant?(pc_pod[1], PC_VERSION_CONST, consts[PC_VERSION_CONST])
    errors << "PurchaseConnector pod dependency pins #{pc_pod[1].inspect}, " \
              "expected reference to #{PC_VERSION_CONST} (= #{consts[PC_VERSION_CONST].inspect})."
  end

  spm_calls.each do |args|
    url = resolve_value(parse_kw(args, 'url'), consts)
    req = parse_kw(args, 'requirement')
    next if url.nil? || req.nil?

    const_name =
      if url.include?('AppsFlyerFramework-Dynamic')
        CORE_VERSION_CONST
      elsif url.include?('PurchaseConnector-Dynamic')
        PC_VERSION_CONST
      end
    if const_name.nil?
      errors << "spm_dependency url #{url.inspect} is neither the core nor PurchaseConnector Dynamic package."
      next
    end

    # Product must be the Dynamic product for this URL (a -Static or bare static
    # product, e.g. 'AppsFlyerLib', must NOT pass).
    products = parse_kw(args, 'products')
    expected_product = const_name == CORE_VERSION_CONST ? 'AppsFlyerLib-Dynamic' : 'PurchaseConnector-Dynamic'
    unless products && products.include?(expected_product)
      errors << "spm_dependency for #{const_name} must use the Dynamic product #{expected_product.inspect}, got #{products.inspect}."
    end

    # Requirement must be an EXACT pin whose version is the matching top-of-file
    # constant — not merely a string that mentions the constant (a range that
    # name-drops the constant must NOT pass).
    kind = resolve_value(parse_kw(req, 'kind'), consts)
    version_tok = parse_kw(req, 'version')
    if kind != 'exactVersion'
      errors << "spm_dependency for #{const_name} must use { kind: 'exactVersion', ... }; got requirement #{req.inspect}."
    elsif version_tok.nil? || !version_token_matches_constant?(version_tok, const_name, consts[const_name])
      errors << "spm_dependency for #{const_name} version #{version_tok.inspect} does not match #{const_name} (= #{consts[const_name].inspect})."
    end
  end

  unless errors.empty?
    raise ParityError, "podspec SPM parity FAILED:\n  - #{errors.join("\n  - ")}"
  end

  puts "[spm-parity] #{spm_calls.length} spm_dependency call(s) checked against pod pins. PASS."
end

if $PROGRAM_NAME == __FILE__
  path = ARGV[0] || DEFAULT_PODSPEC
  begin
    run(path)
  rescue ParityError => e
    warn "[spm-parity] ERROR: #{e.message}"
    exit 1
  end
end
