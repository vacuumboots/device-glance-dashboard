#!/usr/bin/env node
/**
 * Verifies that the latest version header in CHANGELOG.md matches package.json version.
 * Exits with code 1 if mismatch so release workflow can fail early.
 */
import fs from 'fs';
import path from 'path';

const pkgPath = path.resolve(process.cwd(), 'package.json');
const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');

function fail(message) {
  console.error(`\n[release:verify] ❌ ${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(pkgPath)) fail('package.json not found');
if (!fs.existsSync(changelogPath)) fail('CHANGELOG.md not found');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const changelog = fs.readFileSync(changelogPath, 'utf8');

// Find first version header like: ## [1.5.0] - 2025-11-11
const headerMatch = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m);
if (!headerMatch) fail('Could not find a version header in CHANGELOG.md (expected "## [x.y.z]")');

const changelogVersion = headerMatch[1];
const packageVersion = pkg.version;

if (changelogVersion !== packageVersion) {
  fail(`Version mismatch: CHANGELOG.md has ${changelogVersion} but package.json has ${packageVersion}`);
}

console.log(`[release:verify] ✅ Version ${packageVersion} verified against CHANGELOG.md`);