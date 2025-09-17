#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const version = process.argv[2] || '1.0.0';
const tag = `v${version}`;

console.log(`🚀 Creating release ${tag}...`);

try {
  // Build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  // Create release directory
  const releaseDir = `release-${version}`;
  if (fs.existsSync(releaseDir)) {
    fs.rmSync(releaseDir, { recursive: true });
  }
  fs.mkdirSync(releaseDir);

  // Copy built files
  console.log('📋 Copying release files...');
  execSync(`cp -r dist ${releaseDir}/`);
  execSync(`cp package.json ${releaseDir}/`);
  execSync(`cp README.md ${releaseDir}/`);
  execSync(`cp .env.example ${releaseDir}/`);

  // Create release archive
  console.log('🗜️ Creating release archive...');
  execSync(`zip -r mcp-amadeusflights-${tag}.zip ${releaseDir}/`);

  // Create GitHub release
  console.log('🏷️ Creating GitHub release...');
  execSync(`gh release create ${tag} \
    --title "MCP Amadeus Flights Server ${tag}" \
    --notes-file release-notes.md \
    mcp-amadeusflights-${tag}.zip`);

  console.log('✅ Release created successfully!');
  console.log(`🔗 View release: https://github.com/pratikjadhav2726/mcp-amadeusflights/releases/tag/${tag}`);

} catch (error) {
  console.error('❌ Error creating release:', error.message);
  process.exit(1);
}
