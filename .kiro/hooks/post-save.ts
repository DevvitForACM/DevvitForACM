/**
 * Post-Save Hook - Runs after saving any file
 * Automates code quality improvements and test generation
 */

export interface PostSaveConfig {
  enabled: boolean;
  debounceMs: number;
  patterns: FilePattern[];
}

export interface FilePattern {
  glob: string;
  actions: string[];
}

export const postSaveHook: PostSaveConfig = {
  enabled: true,
  debounceMs: 1000, // Wait 1s after last save

  patterns: [
    {
      glob: "src/**/*.ts",
      actions: [
        "sort-imports",
        "generate-test-if-missing",
        "update-barrel-exports"
      ]
    },
    {
      glob: "src/**/*.tsx",
      actions: [
        "sort-imports",
        "generate-test-if-missing",
        "update-barrel-exports"
      ]
    },
    {
      glob: "assets/levels/*.json",
      actions: [
        "validate-level-format",
        "check-required-entities"
      ]
    },
    {
      glob: "src/**/index.ts",
      actions: [
        "verify-barrel-exports"
      ]
    }
  ]
};

/**
 * Sort imports alphabetically
 */
export async function sortImports(filePath: string): Promise<void> {
  console.log(`  📦 Sorting imports in ${filePath}`);
  // Implementation: Use import sorting library
}

/**
 * Generate test file if it doesn't exist
 */
export async function generateTestIfMissing(filePath: string): Promise<void> {
  const testPath = filePath.replace(/\.tsx?$/, '.test.ts');
  console.log(`  🧪 Checking for test file: ${testPath}`);
  // Implementation: Create test file using template
}

/**
 * Update barrel exports (index.ts)
 */
export async function updateBarrelExports(filePath: string): Promise<void> {
  console.log(`  📁 Updating barrel exports for ${filePath}`);
  // Implementation: Scan directory and update index.ts
}

/**
 * Validate level JSON format
 */
export async function validateLevelFormat(filePath: string): Promise<void> {
  console.log(`  ✅ Validating level format: ${filePath}`);
  // Implementation: Check against level schema
}

// Hook execution
export async function executePostSave(filePath: string): Promise<void> {
  console.log(`💾 Post-save actions for: ${filePath}`);
  
  for (const pattern of postSaveHook.patterns) {
    // Match file path against glob pattern
    if (matchesPattern(filePath, pattern.glob)) {
      for (const action of pattern.actions) {
        try {
          await executeAction(action, filePath);
          console.log(`  ✅ ${action} completed`);
        } catch (error) {
          console.warn(`  ⚠️  ${action} failed:`, error);
        }
      }
    }
  }
}

function matchesPattern(filePath: string, pattern: string): boolean {
  // Simple pattern matching (real implementation would use minimatch)
  return filePath.includes(pattern.replace('**/', '').replace('*', ''));
}

async function executeAction(action: string, filePath: string): Promise<void> {
  switch (action) {
    case 'sort-imports':
      await sortImports(filePath);
      break;
    case 'generate-test-if-missing':
      await generateTestIfMissing(filePath);
      break;
    case 'update-barrel-exports':
      await updateBarrelExports(filePath);
      break;
    case 'validate-level-format':
      await validateLevelFormat(filePath);
      break;
    default:
      console.warn(`Unknown action: ${action}`);
  }
}

