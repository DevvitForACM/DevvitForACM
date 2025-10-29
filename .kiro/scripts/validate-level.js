#!/usr/bin/env node

/**
 * Validate level JSON files against schema
 * Usage: node validate-level.js <level-file-path>
 */

const fs = require('fs');
const path = require('path');

function validateLevel(levelFilePath) {
  try {
    // Read level file
    const levelData = JSON.parse(fs.readFileSync(levelFilePath, 'utf8'));

    // Basic validation
    const errors = [];

    // Check required fields
    if (!levelData.metadata) errors.push('Missing metadata');
    if (!levelData.settings) errors.push('Missing settings');
    if (!levelData.objects) errors.push('Missing objects array');

    // Check for player
    const hasPlayer = levelData.objects?.some(obj => obj.type === 'player');
    if (!hasPlayer) errors.push('Level must have at least one player spawn');

    // Check for door/exit
    const hasDoor = levelData.objects?.some(obj => obj.type === 'door');
    if (!hasDoor) errors.push('Level must have at least one exit door');

    // Check bounds
    if (levelData.settings?.bounds) {
      const { width, height } = levelData.settings.bounds;
      if (width <= 0 || height <= 0) {
        errors.push('Invalid bounds: width and height must be positive');
      }
    }

    // Report results
    if (errors.length > 0) {
      console.error(`❌ Validation failed for ${path.basename(levelFilePath)}:`);
      errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    } else {
      console.log(`✅ Level validated successfully: ${path.basename(levelFilePath)}`);
    }
  } catch (error) {
    console.error(`Error validating level: ${error.message}`);
    process.exit(1);
  }
}

// Main
const levelFilePath = process.argv[2];
if (!levelFilePath) {
  console.error('Usage: node validate-level.js <level-file-path>');
  process.exit(1);
}

validateLevel(levelFilePath);

