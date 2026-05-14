# Release operator manual

Step-by-step guide for cutting, validating, and shipping a React Native plugin release using the automated RC pipeline.

## Prerequisites

- **GitHub**: write access to `AppsFlyerSDK/appsflyer-react-native-plugin`, ability to run Actions
- **npm**: publish rights for the `react-native-appsflyer` package
- **Jira**: access to the project for fix-version validation
- **Slack**: member of the release notification channel

## Workflow overview

```
rc-release.yml ─── lint-test-build.yml ───┐
                   ios-e2e.yml ───────────┤
                   android-e2e.yml ───────┤
                                          ▼
                                    publish RC to npm
                                    create pre-release + PR
                                          │
                                    rc-smoke.yml (auto-triggers)
                                          │
                              QA adds "pass QA ready for deploy" label
                                          │
                                    promote-release.yml
                                    (strips -rcN suffix)
                                          │
                              Human merges PR to master
                                          │
                                    production-release.yml
                                    (publishes to npm @latest)
```

## 1. Cut a release candidate

1. Go to **Actions** > **RC - Release Candidate** > **Run workflow**.
2. Fill in the required inputs:

| Input | Required | Example | Description |
|-------|----------|---------|-------------|
| `rn_version` | Yes | `6.18.0-rc1` | Plugin version. Must match `X.Y.Z-rcN` format. |
| `ios_sdk_version` | Yes | `6.18.0` | iOS native AppsFlyer SDK version to pin. |
| `android_sdk_version` | Yes | `6.18.0` | Android native AppsFlyer SDK version to pin. |
| `base_branch` | No | `development` | Branch to cut the release from (default: `development`). |
| `pc_version` | No | `6.15.2` | PurchaseConnector iOS version override. Leave empty to auto-fetch latest from GitHub. |
| `skip_unit` | No | `false` | Skip Jest + ESLint inside Lint, Test & Build. |
| `skip_builds` | No | `false` | Skip Android + iOS release builds inside Lint, Test & Build. |
| `skip_e2e` | No | `false` | Skip iOS + Android E2E test jobs. Blocks publish if not skipped. |
| `dry_run` | No | `true` | **Default is true.** Set to `false` to actually publish to npm. Dry runs still create the branch and PR. |

3. Click **Run workflow**.

## 2. What the pipeline does automatically

Once triggered, the pipeline runs these stages in order:

1. **Validate inputs** -- checks version format, branch existence, and Jira fix version.
2. **Lint, Test & Build** -- Jest tests, ESLint, Android release build, iOS release build.
3. **Create release branch** -- creates `releases/X.Y.Z-rcN` from `base_branch` with version bumps in:
   - `package.json` (version field; `react-native-appsflyer.podspec` reads from this)
   - `android/build.gradle` (Android SDK fallback version)
   - `android/.../RNAppsFlyerConstants.java` (PLUGIN_VERSION)
   - `ios/RNAppsFlyer.h` (kAppsFlyerPluginVersion)
   - `README.md` (SDK version badges)
   - `CHANGELOG.md` (new entry prepended)
4. **E2E tests** -- iOS and Android E2E suites run on the release branch.
5. **Publish RC** -- `npm publish --tag rc` (skipped if `dry_run` is true).
6. **GitHub pre-release** -- created with release notes.
7. **PR to master** -- auto-opened from the release branch.
8. **Slack notification** -- posts to the release channel.
9. **Smoke tests** -- `rc-smoke.yml` triggers automatically after the RC workflow succeeds. Installs the RC from npm in a fresh project and runs smoke scenarios. Posts a `rc-smoke/npm` check-run on the release branch.

## 3. QA validation

1. Wait for the `rc-smoke/npm` check-run to appear green on the PR.
2. Install the RC in a test app and validate manually:
   ```bash
   npm install react-native-appsflyer@6.18.0-rc1
   ```
3. Test attribution, deep linking, and any feature changes specific to this release.
4. If the RC passes QA, apply the label **`pass QA ready for deploy`** to the PR.

If the RC fails QA: fix the issue on `development`, then cut a new RC with an incremented suffix (e.g., `6.18.0-rc2`).

## 4. Promote to production

When the `pass QA ready for deploy` label is applied:

1. `promote-release.yml` triggers automatically.
2. It verifies `rc-smoke/npm` passed, then strips the `-rcN` suffix from all version files on the release branch and commits.
3. **You must manually merge the PR to master.** The bot cannot merge (org policy).

## 5. Production publish

When the PR merges to master:

1. `production-release.yml` triggers automatically.
2. It publishes to npm with the `latest` tag.
3. Creates a GitHub release (not pre-release).
4. Notifies Slack.

## 6. Post-release verification

```bash
# Verify npm
npm view react-native-appsflyer version
# Expected: 6.18.0

# Verify GitHub
# Check https://github.com/AppsFlyerSDK/appsflyer-react-native-plugin/releases
```

## Troubleshooting

### RC smoke tests failed

Check the `rc-smoke.yml` run logs and the `.af-e2e/reports` artifacts. Common causes:
- npm registry propagation delay (retry the smoke workflow manually)
- E2E infrastructure flake (re-run the workflow via Actions > RC Smoke > Run workflow)

### Promote blocked: "rc-smoke/npm is missing"

The smoke workflow hasn't finished or wasn't triggered. Run `rc-smoke.yml` manually with the RC version and release branch, wait for it to pass, then re-apply the `pass QA ready for deploy` label.

### npm publish succeeded but PR/Slack failed

The published package is valid. Manually complete the failed steps:
- Create the PR from the release branch to master if missing.
- Post to Slack manually.

### npm publish failed

Fix the root cause (auth, network, version conflict), then re-run the RC workflow with the **same version**. npm rejects duplicate version+tag combos, so if the version was partially published, you may need to `npm unpublish react-native-appsflyer@6.18.0-rc1` first (within 72h) or bump to `-rc2`.

### Wrong content published to npm

1. Deprecate the bad version:
   ```bash
   npm deprecate react-native-appsflyer@6.18.0-rc1 "broken, use 6.18.0-rc2"
   ```
2. Fix the issue on `development`.
3. Cut a new RC with the next suffix (`-rc2`).

### E2E tests failed during RC

Check `.af-e2e/reports` artifacts in the workflow run. E2E failures block npm publish (unless `skip_e2e` was set). Fix the issue, then either:
- Re-run the failed E2E job from the Actions UI, or
- Cut a new RC if code changes are needed.

### production-release.yml did not trigger after merge

The workflow triggers on `pull_request: closed` to `master` from `releases/*` branches. If it didn't fire:
- Verify the PR was merged (not just closed).
- Verify the source branch matched `releases/*`.
- Use the manual dispatch: Actions > Production Release > Run workflow, enter the version.

## Version files reference

These files contain version strings. The RC and promote workflows update them automatically. Listed here for manual intervention scenarios.

| File | Field | Updated by |
|------|-------|------------|
| `package.json` | `"version"` | RC workflow |
| `react-native-appsflyer.podspec` | `s.version` (reads from package.json) | Indirect |
| `android/build.gradle` | `appsflyerVersion` fallback | RC workflow |
| `android/.../RNAppsFlyerConstants.java` | `PLUGIN_VERSION` | RC workflow |
| `ios/RNAppsFlyer.h` | `kAppsFlyerPluginVersion` | RC workflow |
| `README.md` | SDK version badges | RC workflow |
| `CHANGELOG.md` | Release entry | RC workflow |
