/**
 * On-Error Hook - Runs when runtime errors occur
 * Logs errors, suggests fixes, and helps with debugging
 */

export interface ErrorHookConfig {
  enabled: boolean;
  logToFile: boolean;
  searchSimilar: boolean;
  suggestFixes: boolean;
}

export interface ErrorContext {
  message: string;
  stack?: string;
  file?: string;
  line?: number;
  timestamp: Date;
  userAgent?: string;
}

export const onErrorHook: ErrorHookConfig = {
  enabled: true,
  logToFile: true,
  searchSimilar: true,
  suggestFixes: true
};

/**
 * Handle runtime error
 */
export async function handleError(error: Error, context: Partial<ErrorContext> = {}): Promise<void> {
  const errorContext: ErrorContext = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date(),
    ...context
  };

  console.error("🚨 Runtime Error Detected:");
  console.error(`  Message: ${errorContext.message}`);
  if (errorContext.file) {
    console.error(`  File: ${errorContext.file}:${errorContext.line || '?'}`);
  }

  // Log to file
  if (onErrorHook.logToFile) {
    await logErrorToFile(errorContext);
  }

  // Search for similar errors
  if (onErrorHook.searchSimilar) {
    await searchSimilarErrors(errorContext);
  }

  // Suggest fixes
  if (onErrorHook.suggestFixes) {
    await suggestFixes(errorContext);
  }
}

/**
 * Log error to file for analysis
 */
async function logErrorToFile(context: ErrorContext): Promise<void> {
  const logEntry = {
    timestamp: context.timestamp.toISOString(),
    message: context.message,
    stack: context.stack,
    file: context.file,
    line: context.line
  };

  console.log("  📝 Logging error to: .kiro/logs/errors.json");
  // Implementation: Append to error log file
}

/**
 * Search for similar errors in codebase
 */
async function searchSimilarErrors(context: ErrorContext): Promise<void> {
  console.log("  🔍 Searching for similar errors...");
  
  // Common error patterns
  const patterns = extractErrorPatterns(context.message);
  
  for (const pattern of patterns) {
    console.log(`    → Found pattern: ${pattern}`);
    // Implementation: Search codebase for similar error handling
  }
}

/**
 * Suggest fixes based on error type
 */
async function suggestFixes(context: ErrorContext): Promise<void> {
  console.log("  💡 Suggested fixes:");

  const suggestions = getErrorSuggestions(context.message);
  
  for (const suggestion of suggestions) {
    console.log(`    → ${suggestion}`);
  }
}

/**
 * Extract error patterns for searching
 */
function extractErrorPatterns(message: string): string[] {
  const patterns: string[] = [];

  // Cannot read property 'x' of undefined
  if (message.includes("Cannot read property")) {
    patterns.push("Add null checks before property access");
    patterns.push("Use optional chaining (?.)");
  }

  // is not a function
  if (message.includes("is not a function")) {
    patterns.push("Verify function is imported correctly");
    patterns.push("Check if object has the method");
  }

  // undefined is not an object
  if (message.includes("undefined is not an object")) {
    patterns.push("Add defensive null/undefined checks");
    patterns.push("Ensure variable is initialized");
  }

  return patterns;
}

/**
 * Get specific suggestions based on error message
 */
function getErrorSuggestions(message: string): string[] {
  const suggestions: string[] = [];

  // Type errors
  if (message.includes("Type") && message.includes("is not assignable")) {
    suggestions.push("Check TypeScript types match expected interface");
    suggestions.push("Add type assertion or type guard if needed");
  }

  // Undefined/null errors
  if (message.includes("undefined") || message.includes("null")) {
    suggestions.push("Add null/undefined check before use");
    suggestions.push("Use optional chaining: object?.property");
    suggestions.push("Provide default value: object ?? defaultValue");
  }

  // Module not found
  if (message.includes("Cannot find module")) {
    suggestions.push("Check import path is correct");
    suggestions.push("Verify file exists and is exported");
    suggestions.push("Check for typos in import statement");
  }

  // Network errors
  if (message.includes("Network") || message.includes("fetch")) {
    suggestions.push("Add error handling for network requests");
    suggestions.push("Check API endpoint is correct");
    suggestions.push("Verify CORS configuration");
  }

  // Phaser errors
  if (message.includes("Scene") || message.includes("Phaser")) {
    suggestions.push("Ensure scene is started before accessing");
    suggestions.push("Check texture/asset is loaded");
    suggestions.push("Verify physics body exists");
  }

  return suggestions;
}

/**
 * Analyze error patterns across codebase
 */
export async function analyzeErrorPatterns(): Promise<void> {
  console.log("📊 Analyzing error patterns...");
  // Implementation: Read error log and identify common issues
}

