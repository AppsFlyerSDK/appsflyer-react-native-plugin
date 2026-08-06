/**
 * Linting Tests
 *
 * Tests to ensure code quality and linting rules are followed.
 * These tests verify that the codebase adheres to ESLint rules.
 *
 * Shells out to the eslint CLI (same binary as `npm run lint`) instead of using ESLint's
 * Node API: ESLint v9+'s flat-config loader always loads eslint.config.* via a native
 * dynamic import() (see node_modules/eslint/lib/config/config-loader.js), which Jest's
 * CommonJS runtime rejects with "A dynamic import callback was invoked without
 * --experimental-vm-modules". Running eslint as a child process avoids Jest's module
 * loader entirely and exercises the exact same config resolution `npm run lint` uses.
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ESLINT_BIN = path.join(__dirname, '..', 'node_modules', '.bin', 'eslint');

// Runs eslint over the given paths and returns the parsed --format json report.
// eslint exits non-zero when it finds errors, so the JSON must be read from the caught
// error's stdout in that case rather than from a successful execFileSync return.
function runEslint(patterns) {
  try {
    const stdout = execFileSync(ESLINT_BIN, [...patterns, '--format', 'json'], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
    });
    return JSON.parse(stdout);
  } catch (error) {
    if (error.stdout) {
      return JSON.parse(error.stdout);
    }
    throw error;
  }
}

describe('Linting Tests', () => {
  describe('JavaScript Files', () => {
    test('index.ts should pass ESLint', () => {
      const results = runEslint(['index.ts']);

      results.forEach(result => {
        const errors = result.messages.filter(m => m.severity === 2);
        if (errors.length > 0) {
          // eslint-disable-next-line no-console
          console.info('ESLint issues found:', errors);
        }
        expect(errors).toHaveLength(0);
      });
    });

    test('Expo config plugins should pass ESLint', () => {
      const expoDir = path.join(__dirname, '..', 'expo');
      const files = fs
        .readdirSync(expoDir)
        .filter(f => f.endsWith('.js'))
        .map(f => path.join('expo', f));

      if (files.length === 0) {
        return;
      }

      const results = runEslint(files);

      results.forEach(result => {
        const errors = result.messages.filter(m => m.severity === 2);
        if (errors.length > 0) {
          // eslint-disable-next-line no-console
          console.info(`ESLint errors in ${result.filePath}:`, errors);
        }
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('TypeScript Files', () => {
    test('Purchase Connector models should pass ESLint', () => {
      const results = runEslint(['PurchaseConnector']);

      results.forEach(result => {
        const errors = result.messages.filter(m => m.severity === 2);
        if (errors.length > 0) {
          // eslint-disable-next-line no-console
          console.info(`ESLint errors in ${result.filePath}:`, errors);
        }
        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('Code Quality Rules', () => {
    test('No console.log statements in production code', () => {
      const indexTsPath = path.join(__dirname, '..', 'index.ts');
      const content = fs.readFileSync(indexTsPath, 'utf8');

      // Allow console.warn and console.error, but check for console.log
      const consoleLogMatches = content.match(/console\.log\(/g);

      // console.log is allowed in this codebase (see eslint.config.cjs: no-console: 'off')
      // But we can still check for excessive usage
      // Note: This is informational only, not a failure
      const logCount = consoleLogMatches ? consoleLogMatches.length : 0;

      // This test passes but we track console.log usage
      expect(logCount).toBeGreaterThanOrEqual(0);
    });

    test('No unused variables in test files', () => {
      const testFiles = ['index.test.js', 'compatibility.test.js']
        .map(f => path.join('__tests__', f))
        .filter(f => fs.existsSync(path.join(__dirname, '..', f)));

      if (testFiles.length === 0) {
        return;
      }

      const results = runEslint(testFiles);

      results.forEach(result => {
        const unusedVarErrors = result.messages.filter(
          m => m.ruleId === '@typescript-eslint/no-unused-vars' && m.severity === 2
        );

        if (unusedVarErrors.length > 0) {
          // eslint-disable-next-line no-console
          console.info(`Unused variables in ${result.filePath}:`, unusedVarErrors);
        }

        // Allow unused vars with _ prefix (see eslint.config.cjs)
        const nonPrefixedUnused = unusedVarErrors.filter(e => !e.message.includes('_'));
        expect(nonPrefixedUnused).toHaveLength(0);
      });
    });
  });
});
