#!/usr/bin/env node
/*
 Reads CHANGELOG.md and prints the body for the latest version header to stdout.
 Usage: npm run release:notes | gh release edit <tag> --notes-file -
*/

const fs = require('fs');
const path = require('path');

function getLatestSection(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    const versionMatch = line.match(/^## \[(?<version>[^\]]+)\]/);
    if (versionMatch) {
      if (current) sections.push(current);
      current = { header: line, body: [] };
      continue;
    }
    if (current) current.body.push(line);
  }
  if (current) sections.push(current);

  return sections[0] || null;
}

(function main() {
  const changelogPath = path.resolve(process.cwd(), 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    console.error('CHANGELOG.md not found');
    process.exit(1);
  }
  const md = fs.readFileSync(changelogPath, 'utf8');
  const section = getLatestSection(md);
  if (!section) {
    console.error('No version section found in CHANGELOG.md');
    process.exit(1);
  }

  // Emit header as title and body below
  const header = section.header.replace(/^##\s+/, '').trim();
  const body = section.body.join('\n').trim();

  // GitHub release body
  console.log(`# ${header}\n`);
  console.log(body);
})();
