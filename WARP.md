# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

A Devvit-based Reddit application featuring a Phaser.js platformer game with React frontend, Express backend, Firebase integration, and Reddit OAuth authentication. Built to run both within the Devvit platform and standalone for local development.

**New to this project?** See `QUICKSTART.md` for a beginner-friendly guide to getting started.

## Essential Commands

### Development
```bash
npm run dev              # Start dev server with hot reload (client + server + Devvit playtest)
npm run dev:local        # Run standalone server without Devvit context (port 3000)
npm run dev:vite         # Start Vite dev server only (port 7474)
```

### Building
```bash
npm run build            # Build both client and server for production
npm run build:client     # Build React/Vite client only
npm run build:server     # Build Express server only
npm run build:local      # Build server for standalone/local execution
```

### Quality & Testing
```bash
npm run check            # Run all checks: type-check + lint:fix + prettier
npm run type-check       # TypeScript compilation check across all projects
npm run lint             # Lint src/ directory
npm run lint:fix         # Auto-fix linting issues
npm run prettier         # Format code with Prettier
```

### Deployment (Devvit)
```bash
npm run login            # Authenticate with Reddit/Devvit CLI
npm run deploy           # Build and upload new version to Devvit
npm run launch           # Build, deploy, and publish for review
```

## Architecture

### Dual-Context Execution

The server is designed to run in **two contexts**:
1. **Devvit Context**: When deployed on Reddit's platform (`DEVVIT_EXECUTION_ID` env var exists)
2. **Standalone Context**: For local development/testing (standard Node.js environment)

Key architectural patterns:
- `src/server/index.ts` detects context at runtime via `process.env.DEVVIT_EXECUTION_ID`
- Devvit-specific modules (`@devvit/web/server`, Redis, Reddit API) are conditionally imported
- Settings are loaded from either Devvit's `settings` API or `.env` file
- `src/server/variables.ts` provides async config loading with automatic fallbacks

### Project Structure

```
src/
├── client/          # React + Phaser frontend
│   ├── game/        # Phaser game engine code
│   │   ├── entities/    # Game objects (Player, Enemy, Coin, Door, Spike, Spring, Tile)
│   │   ├── scenes/      # Phaser scenes (MainScene, PlayScene, WASDScene, CreateScene)
│   │   ├── level/       # Level system, chunk management, JSON conversion
│   │   └── controls/    # Camera and input controls
│   ├── pages/       # React pages (Home, Play, Create)
│   ├── components/  # React components (PhaserContainer, routing, player)
│   ├── config/      # Game configuration (Phaser config, constants)
│   └── hooks/       # Custom hooks (useGameLoader)
│
├── server/          # Express backend
│   ├── controllers/ # Request handlers (auth, leaderboard)
│   ├── services/    # Business logic (auth, Firebase Admin)
│   ├── routes/      # API route definitions
│   ├── middlewares/ # Auth middleware (JWT validation)
│   ├── core/        # Devvit-specific (post creation)
│   └── config/      # Environment loading
│
└── shared/          # Shared types between client and server
    └── types/       # TypeScript interfaces
```

### TypeScript Project References

The codebase uses TypeScript project references for efficient compilation:
- Root `tsconfig.json` references client, server, and shared projects
- Each project has its own `tsconfig.json` with specific compiler options
- Client uses `jsx: react-jsx` and browser globals
- Server uses Node.js types and compiles to CommonJS
- Shared provides common types to both contexts

Client uses path alias: `@/*` maps to `src/client/`

### Game Architecture (Phaser)

**Entity System**: All game objects extend `BaseEntity` with:
- Lifecycle management (update, destroy)
- Collision handling (onCollision)
- Position/dimension properties
- Centralized management via `EntityController`

**Scene System**: Phaser scenes for different game states:
- `MainScene`: Basic platformer with camera follow
- `PlayScene`: Full game level with configurable hazards
- `WASDScene`: Alternative control scheme demo
- `CreateScene`: Level editor interface

**Responsive Design**:
- Phaser uses `RESIZE` scale mode to fill parent container
- React container uses Tailwind (`w-screen h-screen`)
- UI elements listen to `Phaser.Scale.Events.RESIZE`
- Camera and world bounds adjust dynamically

**Level System**:
- Chunk-based streaming/culling for large worlds
- `LevelConfig` type defines world dimensions, physics, hazards
- JSON level serialization/deserialization
- Configurable per-scene via props

### Backend Architecture

**Dual Routing**:
- **Devvit-only routes** (`/api/init`, `/api/increment`, `/internal/*`): Only active when `isDevvitContext` is true, use Redis/Reddit APIs
- **Universal routes** (`/auth/*`, `/api/leaderboard/*`): Work in both contexts

**Authentication Flow**:
1. Frontend redirects to Reddit OAuth URL
2. User authorizes, Reddit redirects to `/auth/reddit/callback?code=...`
3. Backend exchanges code for Reddit access token
4. Creates/fetches Firebase user with UID `reddit:{redditId}`
5. Stores user profile in Firebase Realtime Database
6. Returns JWT (7-day expiry) for API access
7. Protected routes use `requireAuth` middleware to validate JWT

**Firebase Integration**:
- Firebase Admin SDK for user management and database writes
- Supports test mode (without service account JSON) for development
- `firebase-admin.service.ts` provides `safeAdminAuth()` for safe operations
- Stores user profiles and leaderboard data in Realtime Database

**Settings Management**:
- In Devvit context: Loads from `devvit.json` settings via `settings.get()`
- In standalone: Loads from `.env` file
- `variables.ts` exports synchronous values and async `getConfigValue()` helper
- Settings include Firebase config, Reddit OAuth, JWT secret

## Environment Setup

### Local Development vs Devvit Deployment

**Important**: This app uses settings configured in two different ways:

1. **Devvit Deployment**: Settings in `devvit.json` are configured through Reddit's UI when the app is installed to a subreddit
2. **Local Development**: Settings are loaded from `.env` file

The code in `src/server/variables.ts` automatically falls back to `.env` when not running in Devvit context.

### Required Environment Variables

For **local development**, copy `.env.example` to `.env` and configure:

```bash
# Firebase Configuration
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
FIREBASE_DATABASE_URL=
FIREBASE_CLIENT_EMAIL=        # For Firebase Admin
FIREBASE_PRIVATE_KEY=         # For Firebase Admin

# Reddit OAuth
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_REDIRECT_URI=http://localhost:3000/auth/reddit/callback

# JWT
JWT_SECRET=your_secret_key_here

# Devvit
DEVVIT_SUBREDDIT=r/your_test_subreddit

# Server
PORT=3000
```

### Devvit Configuration

The `devvit.json` file defines:
- App name and structure
- Client build output (`dist/client/index.html`)
- Server entry point (`dist/server/index.cjs`)
- Menu items (moderator actions)
- App install triggers
- Global settings (mirroring environment variables above)

All settings in `devvit.json` become available via `settings.get()` when deployed.

## Testing the Backend

See `SERVER_TESTING_GUIDE.md` for detailed testing procedures including:
- Starting the standalone server
- Testing health checks and auth status
- Reddit OAuth flow walkthrough
- JWT-protected endpoint testing
- Postman collection examples
- Troubleshooting guide

Quick test:
```powershell
npm run dev:local
# Server starts on http://localhost:3000
# Visit http://localhost:3000/health
```

## Key Implementation Details

### Build System
- **Client**: Vite builds React + Phaser to `dist/client/` with static assets from `assets/`
- **Server**: Vite builds SSR bundle to `dist/server/index.cjs` (CommonJS for Devvit compatibility)
- **Watch Mode**: `dev` script runs concurrent builds with `--watch` flag

### ESLint Configuration
- Separate rules for client (React hooks) vs server (Node.js) vs tools
- Enforces `@typescript-eslint/no-floating-promises: error`
- React Refresh plugin for hot reload
- Ignores: dist/, build/, node_modules/, config files

### Node Version
Requires **Node 22** (specified in server build target and README).

### Asset Handling
- Static assets stored in repo-level `assets/` directory
- Vite's `publicDir` points to `assets/` for client builds
- `devvit.json` media.dir points to `assets/` for Devvit platform

### Package Manager
Uses npm with lock file (`package-lock.json`). The project is marked as `private: true`.

## Common Development Issues

### Settings/Environment Warnings

If you see warnings about missing Firebase or Reddit OAuth settings when running `npm run dev` or `npm run dev:local`:

**Cause**: The app tries to load settings from `devvit.json` (for Devvit context) but falls back to `.env` file for local development.

**Solution**:
1. Ensure you have a `.env` file in the project root (copy from `.env.example`)
2. Configure all required variables in `.env` with your Firebase and Reddit credentials
3. The warnings will disappear once `.env` is properly configured
4. For Devvit deployment, configure these same settings through Reddit's UI after installing the app

**Note**: You can suppress initial warnings during development by setting `SUPPRESS_WARNINGS=true` in `.env` (this is already set in the `dev:devvit` script).
