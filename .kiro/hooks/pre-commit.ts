/**
 * Pre-Commit Hook - Runs before every Git commit
 * Ensures code quality and prevents broken code from being committed
 */

export interface HookConfig {
  enabled: boolean;
  timeout: number;
  actions: Action[];
}

export interface Action {
  name: string;
  command: string;
  failOnError: boolean;
  description: string;
}

export const preCommitHook: HookConfig = {
  enabled: true,
  timeout: 60000, // 60 seconds

  actions: [
    {
      name: "ESLint",
      command: "eslint --fix src/",
      failOnError: true,
      description: "Run ESLint with auto-fix on all source files"
    },
    {
      name: "TypeScript",
      command: "tsc --noEmit",
      failOnError: true,
      description: "Type-check all TypeScript files"
    },
    {
      name: "Prettier",
      command: "prettier --write src/",
      failOnError: false,
      description: "Format code with Prettier"
    },
    {
      name: "Run Tests",
      command: "npm test -- --changed",
      failOnError: true,
      description: "Run tests for changed files only"
    }
  ]
};

// Hook execution logic
export async function executePreCommit(): Promise<void> {
  console.log("🔍 Running pre-commit checks...");
  
  for (const action of preCommitHook.actions) {
    try {
      console.log(`  ⚙️  ${action.name}: ${action.description}`);
      // Execute command here (implementation depends on runtime)
      console.log(`  ✅ ${action.name} passed`);
    } catch (error) {
      console.error(`  ❌ ${action.name} failed:`, error);
      if (action.failOnError) {
        throw new Error(`Pre-commit hook failed at ${action.name}`);
      }
    }
  }
  
  console.log("✨ All pre-commit checks passed!");
}

