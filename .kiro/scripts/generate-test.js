#!/usr/bin/env node

/**
 * Auto-generate test file template for TypeScript files
 * Usage: node generate-test.js <source-file-path>
 */

const fs = require('fs');
const path = require('path');

function generateTest(sourceFilePath) {
  const parsed = path.parse(sourceFilePath);
  const testFilePath = path.join(parsed.dir, `${parsed.name}.test.ts`);

  // Check if test file already exists
  if (fs.existsSync(testFilePath)) {
    console.log(`Test file already exists: ${testFilePath}`);
    return;
  }

  // Read source file to extract function names
  let functions = [];
  try {
    const sourceCode = fs.readFileSync(sourceFilePath, 'utf8');
    const functionRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    let match;
    while ((match = functionRegex.exec(sourceCode)) !== null) {
      functions.push(match[1]);
    }
  } catch (error) {
    console.error(`Error reading source file: ${error.message}`);
    return;
  }

  // Generate test template
  const template = `/**
 * @file ${parsed.name}.test.ts
 * @description Tests for ${parsed.name}
 * @created ${new Date().toISOString().split('T')[0]}
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ${functions.join(', ')} } from './${parsed.name}';

describe('${parsed.name}', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

${functions.map(fn => `  describe('${fn}', () => {
    it('should work correctly', () => {
      // TODO: Implement test
      expect(true).toBe(true);
    });
  });`).join('\n\n')}
});
`;

  // Write test file
  try {
    fs.writeFileSync(testFilePath, template, 'utf8');
    console.log(`✅ Generated test file: ${testFilePath}`);
  } catch (error) {
    console.error(`Error writing test file: ${error.message}`);
  }
}

// Main
const sourceFilePath = process.argv[2];
if (!sourceFilePath) {
  console.error('Usage: node generate-test.js <source-file-path>');
  process.exit(1);
}

generateTest(sourceFilePath);

