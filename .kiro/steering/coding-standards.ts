/**
 * Coding Standards for DevvitForACM Project
 * These rules guide AI code generation and enforce consistency
 */

export interface CodingStandards {
  typescript: TypeScriptRules;
  react: ReactRules;
  phaser: PhaserRules;
  naming: NamingConventions;
  documentation: DocumentationRules;
  testing: TestingStandards;
  performance: PerformanceGuidelines;
  security: SecurityRules;
}

export interface TypeScriptRules {
  strictMode: boolean;
  explicitReturnTypes: boolean;
  noImplicitAny: boolean;
  preferences: string[];
}

export interface ReactRules {
  componentStyle: 'functional' | 'class';
  propsTyping: 'required' | 'optional';
  hooks: string[];
  optimization: string[];
}

export interface PhaserRules {
  typeAnnotations: boolean;
  resourceCleanup: boolean;
  physicsBodyHandling: string[];
}

export const codingStandards: CodingStandards = {
  typescript: {
    strictMode: true,
    explicitReturnTypes: true,
    noImplicitAny: true,
    preferences: [
      "Use optional chaining (?.) instead of conditional checks",
      "Use nullish coalescing (??) for default values",
      "Prefer const over let",
      "Use const assertions (as const) where appropriate",
      "Avoid type 'any' - use 'unknown' or proper types",
      "Use union types instead of enums when possible",
      "Explicit function return types required",
      "Use interfaces for object shapes, types for unions",
    ]
  },

  react: {
    componentStyle: 'functional',
    propsTyping: 'required',
    hooks: [
      "Use useState for component state",
      "Use useEffect for side effects with dependencies",
      "Use useCallback for event handlers passed as props",
      "Use useMemo for expensive calculations",
      "Use useRef for DOM references and mutable values",
      "Custom hooks for reusable logic (use prefix 'use')",
    ],
    optimization: [
      "Memoize components with React.memo when appropriate",
      "Wrap callbacks with useCallback to prevent re-renders",
      "Use useMemo for derived state",
      "Avoid inline object/array creation in render",
      "Split large components into smaller ones",
    ]
  },

  phaser: {
    typeAnnotations: true,
    resourceCleanup: true,
    physicsBodyHandling: [
      "Always check if body exists before use",
      "Clean up physics bodies in destroy()",
      "Use explicit types for Phaser.Physics.Arcade.Body",
      "Set body size explicitly with setSize()",
      "Enable physics only when needed",
      "Use object pooling for frequently created objects",
    ]
  },

  naming: {
    variables: "camelCase",
    functions: "camelCase",
    classes: "PascalCase",
    interfaces: "PascalCase",
    types: "PascalCase",
    constants: "SCREAMING_SNAKE_CASE",
    files: {
      components: "kebab-case.tsx",
      utilities: "kebab-case.ts",
      tests: "*.test.ts",
      types: "*.types.ts or *.d.ts",
    },
    examples: [
      "const playerSpeed = 240;",
      "function handleJump() {}",
      "class GameManager {}",
      "interface PlayerProps {}",
      "type EntityType = 'player' | 'enemy';",
      "const MAX_JUMP_HEIGHT = 360;",
    ]
  },

  documentation: {
    required: [
      "JSDoc for all exported functions",
      "JSDoc for all public class methods",
      "Interface/type documentation",
      "Complex algorithm explanations",
    ],
    style: "Explain WHY, not WHAT",
    examples: [
      "// BAD: Increment counter\ncounter++;",
      "// GOOD: Track retry attempts for exponential backoff\ncounter++;",
    ],
    todoFormat: "// TODO(username): Description of what needs to be done",
  },

  testing: {
    framework: "Jest + React Testing Library",
    coverage: {
      target: 80,
      enforced: false,
    },
    patterns: [
      "AAA: Arrange, Act, Assert",
      "Descriptive test names: 'should do X when Y'",
      "One assertion per test when possible",
      "Mock external dependencies",
      "Test edge cases and error conditions",
    ],
    examples: [
      "describe('Player movement', () => {",
      "  it('should move right when D key is pressed', () => {",
      "    // Arrange",
      "    const player = createPlayer();",
      "    // Act",
      "    player.handleInput({ right: true });",
      "    // Assert",
      "    expect(player.velocity.x).toBeGreaterThan(0);",
      "  });",
      "});",
    ]
  },

  performance: {
    rules: [
      "Avoid operations in render loops (update/render)",
      "Use object pooling for frequently created objects",
      "Debounce expensive operations",
      "Lazy load heavy assets",
      "Use sprite sheets instead of individual images",
      "Cache computed values with useMemo",
      "Virtualize long lists",
    ],
    phaser: [
      "Limit number of active physics bodies",
      "Use texture atlases for sprites",
      "Disable physics when not needed",
      "Pool particles and projectiles",
      "Use roundPixels for camera",
    ]
  },

  security: {
    input: [
      "Validate all user input",
      "Sanitize data before database operations",
      "Use parameterized queries",
      "Escape HTML in user-generated content",
    ],
    authentication: [
      "Never store passwords in plain text",
      "Use JWT for API authentication",
      "Validate tokens on every request",
      "Implement rate limiting",
    ],
    environment: [
      "Store secrets in .env (never commit)",
      "Use environment variables for configuration",
      "Separate dev/prod configurations",
    ]
  }
};

/**
 * File organization standards
 */
export const fileOrganization = {
  structure: {
    oneComponentPerFile: true,
    colocateTests: true,
    indexExports: "barrel exports for public API",
  },
  imports: {
    order: [
      "1. External libraries (react, phaser, etc.)",
      "2. Internal absolute imports (@/...)",
      "3. Relative imports",
      "4. Type imports (import type)",
      "5. CSS/assets",
    ],
    grouping: "Group by category with blank lines between",
  }
};

/**
 * Git conventions
 */
export const gitConventions = {
  commits: {
    format: "type(scope): description",
    types: [
      "feat: New feature",
      "fix: Bug fix",
      "docs: Documentation",
      "style: Formatting",
      "refactor: Code restructure",
      "test: Add tests",
      "chore: Maintenance",
    ],
    examples: [
      "feat(player): Add running animation",
      "fix(collision): Correct hitbox offset",
      "refactor(scene): Split PlayScene into modules",
    ]
  },
  branches: {
    format: "type/description-in-kebab-case",
    examples: [
      "feature/victory-screen",
      "fix/player-collision",
      "refactor/scene-modularization",
    ]
  }
};

/**
 * Error handling standards
 */
export const errorHandling = {
  promises: [
    "Always handle promise rejections with .catch() or try-catch",
    "Use async/await with try-catch for readability",
    "Log errors with context information",
  ],
  types: [
    "Create typed error classes for domain errors",
    "Use Error subclasses for specific error types",
    "Include stack traces in logged errors",
  ],
  validation: [
    "Fail fast - validate inputs early",
    "Throw errors for programming mistakes",
    "Return error objects for expected failures",
  ]
};

