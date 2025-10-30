/**
 * Project Context for DevvitForACM
 * Deep project knowledge that guides AI code generation
 */

export interface ProjectContext {
  overview: ProjectOverview;
  techStack: TechStack;
  architecture: Architecture;
  domainKnowledge: DomainKnowledge;
  commonPatterns: CommonPatterns;
  knownIssues: KnownIssues[];
}

export interface ProjectOverview {
  name: string;
  description: string;
  platform: string;
  type: string;
}

export interface TechStack {
  frontend: string[];
  backend: string[];
  devTools: string[];
}

export const projectContext: ProjectContext = {
  overview: {
    name: "Snooventure - Devvit Platformer",
    description: "2D platformer game with integrated level editor for Reddit",
    platform: "Reddit Devvit",
    type: "Game with user-generated content"
  },

  techStack: {
    frontend: [
      "React 18 - UI framework",
      "Phaser 3 - Game engine",
      "TypeScript - Type safety",
      "Vite - Build tool",
      "Tailwind CSS - Styling",
    ],
    backend: [
      "Node.js 22+ - Runtime",
      "Express - API server",
      "Redis - Key-value store (Devvit)",
      "PostgreSQL - Relational database",
      "JWT - Authentication",
    ],
    devTools: [
      "Kiro IDE - AI-powered development",
      "ESLint - Linting",
      "Prettier - Formatting",
      "Jest - Testing",
    ]
  },

  architecture: {
    client: {
      structure: "src/client/",
      pages: [
        "home/ - Landing page",
        "create/ - Level editor",
        "play/ - Level selection and gameplay",
      ],
      components: [
        "auth-guard.tsx - Authentication wrapper",
        "phaser-container.tsx - Game canvas wrapper",
        "routing.tsx - Client-side router",
        "virtual-joystick.tsx - Mobile controls",
      ],
      game: {
        path: "game/",
        scenes: [
          "create-scene.ts - Level editor scene",
          "play-scene.ts - Gameplay scene",
        ],
        entities: [
          "player.ts - Player character",
          "enemy.ts - Enemy AI",
          "coin.ts - Collectible",
          "platform.ts - Ground/platforms",
        ],
        systems: [
          "controls/ - Input handling",
          "level/ - Level data management",
        ]
      },
    },
    server: {
      structure: "src/server/",
      layers: [
        "controllers/ - HTTP request handlers",
        "services/ - Business logic",
        "models/ - Data models",
        "routes/ - API endpoints",
      ],
      api: [
        "/api/auth - Authentication",
        "/api/levels - Level CRUD",
        "/api/leaderboard - Scores",
      ]
    },
    shared: {
      types: "src/shared/types/ - Shared TypeScript types"
    }
  },

  domainKnowledge: {
    gridSystem: {
      cellSize: "60x60px",
      origin: "Bottom-left corner",
      coordinateConversion: {
        toPixelX: "gridX * 60 + 30 (center of cell)",
        toPixelY: "height - gridY * 60 - 30 (flip Y axis)",
      },
      notes: [
        "Phaser Y increases downward (screen space)",
        "Grid Y increases upward (world space)",
        "Player and door span 2 cells vertically (100px)",
      ]
    },

    playerMechanics: {
      dimensions: {
        visualHeight: "100px",
        collisionBox: "60x100px (width x height)",
        positioning: "Y offset by -20px to account for height",
      },
      physics: {
        gravity: 800,
        jumpVelocity: -360,
        moveSpeed: 240,
        dragX: 900,
        maxVelocity: { x: 400, y: 1200 },
      },
      animations: [
        "idle: 5 frames @ 8fps (loop)",
        "run: 3 frames @ 10fps (loop)",
        "jump: 5 frames @ 12fps (no loop)",
      ],
      controls: {
        desktop: "WASD or Arrow Keys + Space to jump",
        mobile: "Virtual joystick + Jump button",
      }
    },

    entities: {
      player: {
        size: "60x100px",
        spawn: "Required exactly 1 per level",
        behavior: "User-controlled",
      },
      door: {
        size: "60x100px",
        spawn: "Required exactly 1 per level",
        behavior: "Level exit, press jump to enter",
      },
      enemy: {
        size: "60x60px",
        spawn: "Optional, multiple allowed",
        behavior: "Patrol AI, bounces at platform edges",
      },
      coin: {
        size: "60x60px",
        spawn: "Optional, multiple allowed",
        behavior: "Collectible, +100 points, floating animation",
      },
      spike: {
        size: "60x60px",
        spawn: "Optional, multiple allowed",
        behavior: "Deadly, instant game over",
      },
      lava: {
        size: "60x60px",
        spawn: "Optional, multiple allowed",
        behavior: "Deadly, instant game over",
      },
      spring: {
        size: "60x60px",
        spawn: "Optional, multiple allowed",
        behavior: "Bounce pad, 250ms cooldown",
      },
      grass: {
        size: "60x60px",
        spawn: "Optional, multiple allowed",
        behavior: "Platform (solid ground)",
      },
      dirt: {
        size: "60x60px",
        spawn: "Optional, multiple allowed",
        behavior: "Platform (underground fill)",
      },
    },

    scoring: {
      timer: {
        initial: 500, // seconds
        behavior: "Counts down during gameplay",
        penalty: "Game over when timer reaches 0",
      },
      points: {
        timeBonus: "10 points per second remaining",
        coinBonus: "100 points per coin collected",
        totalScore: "timeBonus + coinBonus",
      },
      leaderboard: "Per-level, sorted by total score descending",
    },

    levelEditor: {
      placement: "Click or drag to place entities",
      deletion: {
        desktop: "Right-click to delete",
        mobile: "Select eraser tool, then tap entities",
      },
      validation: [
        "Must have exactly 1 player",
        "Must have exactly 1 door",
        "Cannot place entities outside grid bounds",
        "Cannot stack entities in same cell (except visual)",
      ],
      quickPlay: "Test level immediately without saving",
      save: "Requires name, optional description",
    }
  },

  commonPatterns: {
    sceneLifecycle: [
      "init(data) - Receive scene data",
      "preload() - Load assets",
      "create() - Setup scene",
      "update(time, delta) - Game loop",
      "shutdown() - Cleanup before scene ends",
      "destroy() - Final cleanup",
    ],

    modularScenes: {
      pattern: "Split large scenes into modules",
      example: [
        "play-scene/setup.ts - Scene initialization",
        "play-scene/camera.ts - Camera management",
        "play-scene/controls.ts - Input handling",
        "play-scene/collisions.ts - Physics interactions",
        "play-scene/ui.ts - UI elements",
        "play-scene/enemies.ts - Enemy AI",
      ],
      benefit: "Easier to maintain and test",
    },

    reactPhaserIntegration: {
      pattern: "React controls UI, Phaser handles game",
      flow: [
        "1. React renders PhaserContainer component",
        "2. PhaserContainer creates Phaser game instance",
        "3. React state updates trigger Phaser scene methods",
        "4. Phaser events bubble up to React handlers",
      ],
      example: {
        playButton: "React onClick → calls scene.scene.start(PLAY)",
        entityPalette: "React state → scene.registry.set('selectedEntity')",
      }
    },

    levelDataFlow: {
      creation: [
        "1. User places entities in CreateScene",
        "2. level-builder.ts converts to LevelData JSON",
        "3. Save to server via API",
      ],
      loading: [
        "1. Fetch level JSON from server/localStorage",
        "2. json-conversion.ts creates Phaser objects",
        "3. PlayScene renders and enables physics",
      ],
    },

    errorHandling: {
      phaser: [
        "Always check if scene/object exists before use",
        "Use optional chaining: this.player?.setVelocity()",
        "Cleanup in shutdown() to prevent memory leaks",
      ],
      api: [
        "Wrap fetch in try-catch",
        "Show user-friendly error messages",
        "Log detailed errors to console",
      ],
    }
  },

  knownIssues: [
    {
      issue: "Player phases through platforms",
      cause: "Player height (100px) not accounted in Y position",
      solution: "Offset Y by -20px in level-builder.ts",
      files: ["src/client/pages/create/level-builder.ts"]
    },
    {
      issue: "Door collision doesn't trigger",
      cause: "Door treated as 60x60 instead of 60x100",
      solution: "Update ENTITY_SIZES.DOOR.HEIGHT to 100",
      files: ["src/client/constants/game-constants.ts"]
    },
    {
      issue: "Editor breaks after playing level",
      cause: "Scene not properly restarted, event listeners not cleaned up",
      solution: "Use scene.restart() instead of scene.start(), add shutdown() method",
      files: [
        "src/client/pages/create/actions.ts",
        "src/client/game/scenes/create-scene.ts",
        "src/client/game/scenes/play-scene.ts"
      ]
    },
    {
      issue: "TypeScript strict mode errors",
      cause: "Optional properties assigned undefined",
      solution: "Use 'delete' instead of assigning undefined",
      files: ["Multiple files with optional properties"]
    },
    {
      issue: "Mobile gestures interfere with gameplay",
      cause: "Touch events not properly handled",
      solution: "Add preventDefault() on game canvas touches",
      files: ["src/client/components/phaser-container.tsx"]
    }
  ]
};

/**
 * Development workflow best practices
 */
export const workflowGuidelines = {
  setup: [
    "1. npm install",
    "2. npm run login (authenticate with Reddit)",
    "3. npm run dev (starts local server + uploads to Reddit)",
  ],

  testing: [
    "Run 'npm run check' before committing",
    "Use Create page Quick Play for rapid iteration",
    "Test on both desktop and mobile viewports",
  ],

  debugging: {
    clientSide: "Use browser DevTools console",
    serverSide: "Check Devvit logs in terminal",
    phaser: "Enable debug mode in game config",
  },

  deployment: [
    "1. npm run build",
    "2. npm run deploy (uploads to Reddit)",
    "3. npm run launch (submits for review)",
  ]
};

/**
 * Performance optimization tips
 */
export const performanceTips = {
  phaser: [
    "Use texture atlases instead of individual sprites",
    "Limit active physics bodies (< 100 recommended)",
    "Disable physics when objects are off-screen",
    "Use object pooling for projectiles/particles",
    "Set camera.roundPixels = true for crisp rendering",
  ],

  react: [
    "Memoize expensive calculations with useMemo",
    "Wrap callbacks with useCallback",
    "Use React.memo for pure components",
    "Avoid inline object creation in render",
  ],

  general: [
    "Lazy load heavy assets",
    "Debounce expensive operations (> 16ms)",
    "Use web workers for CPU-intensive tasks",
    "Optimize images (compress, use WebP)",
  ]
};

