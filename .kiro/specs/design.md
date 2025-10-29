# Technical Design - DevvitForACM

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  React UI     │  │  Phaser Game │  │  Service Layer  │  │
│  │  - Routing    │  │  - Scenes    │  │  - Auth         │  │
│  │  - Components │  │  - Entities  │  │  - Audio        │  │
│  │  - Pages      │  │  - Physics   │  │                 │  │
│  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│          │                  │                    │           │
│          └──────────────────┴────────────────────┘           │
│                              │                                │
└──────────────────────────────┼────────────────────────────────┘
                               │ HTTP/WebSocket
┌──────────────────────────────┼────────────────────────────────┐
│                        Server Layer                           │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Controllers  │  │   Services   │  │     Models      │  │
│  │  - Auth       │  │  - Redis     │  │  - Level        │  │
│  │  - Levels     │  │  - Auth      │  │  - Leaderboard  │  │
│  │  - Leaderboard│  │  - Levels    │  │                 │  │
│  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│          │                  │                    │           │
│          └──────────────────┴────────────────────┘           │
│                              │                                │
└──────────────────────────────┼────────────────────────────────┘
                               │
                       ┌───────▼────────┐
                       │  Redis Store   │
                       │  - Sessions    │
                       │  - Levels      │
                       │  - Leaderboard │
                       └────────────────┘
```

---

## Component Architecture

### Client Architecture

#### 1. React Layer (`src/client/`)

**Pages:**
- `pages/home/` - Landing page with level selection
- `pages/play/` - Gameplay page
- `pages/create/` - Level editor page

**Components:**
- `components/auth-guard.tsx` - Protected route wrapper
- `components/phaser-container.tsx` - Phaser game mount point
- `components/virtual-joystick.tsx` - Mobile touch controls
- `components/routing.tsx` - Navigation utilities

**Services:**
- `services/auth.service.ts` - Authentication API calls
- `services/audio-manager.ts` - Sound effect management

**Config:**
- `config/game-config.ts` - Phaser configuration
- `config/game-config-wasd.ts` - Alternative control scheme

---

#### 2. Phaser Game Layer (`src/client/game/`)

**Scene Architecture:**

```
PlayScene (play-scene.ts)
├── setup.ts          - Asset loading, animations, physics
├── camera.ts         - Camera controls, zoom calculation
├── controls.ts       - Input handling (keyboard + mobile)
├── collisions.ts     - Physics collision handlers
├── ui.ts             - Game over, level complete screens
└── enemies.ts        - Enemy AI and patrol logic

CreateScene (create-scene.ts)
├── grid.ts           - Grid rendering, resize handling
├── animations.ts     - Entity animation setup
├── controls.ts       - Editor input (pan, zoom, touch)
└── entities.ts       - Entity placement, removal, state
```

**Entity System:**
- `entities/base-entity.ts` - Base entity class
- `entities/player.ts` - Player entity logic
- `entities/enemy.ts` - Enemy entity with patrol
- `entities/coin.ts` - Collectible coin
- `entities/spike.ts` - Hazard entity
- `entities/spring.ts` - Bouncing platform
- `entities/door.ts` - Level exit
- `entities/tile.ts` - Platform tiles
- `entities/collision-manager.ts` - Collision detection
- `entities/entity-controller.ts` - Entity lifecycle management

**Level System:**
- `level/level-schema.ts` - Zod schema validation
- `level/level-types.ts` - TypeScript types
- `level/json-conversion.ts` - Level data ↔ Phaser objects
- `level/chunk-manager.ts` - Level streaming/chunking

---

### Server Architecture (`src/server/`)

#### 1. Controllers
Handle HTTP request/response:
```typescript
auth.controller.ts
  - POST /auth/login
  - POST /auth/logout
  - GET /auth/me

levels.controller.ts
  - GET /levels
  - GET /levels/:name
  - POST /levels
  - PUT /levels/:name
  - DELETE /levels/:name

leaderboard.controller.ts
  - GET /leaderboard/:levelName
  - POST /leaderboard/:levelName
```

#### 2. Services
Business logic layer:
```typescript
auth.service.redis.ts
  - createSession()
  - validateSession()
  - deleteSession()
  - refreshToken()

levels.service.redis.ts
  - saveLevel()
  - getLevel()
  - listLevels()
  - deleteLevel()
  - validateLevel()

leaderboard.service.redis.ts
  - getTopScores()
  - submitScore()
  - getUserBestScore()
  - updateRankings()
```

#### 3. Middlewares
```typescript
auth.ts
  - verifyToken()
  - requireAuth()
  - refreshIfExpired()
```

#### 4. Models
Data structures and validation:
```typescript
level.ts
  - LevelData interface
  - LevelMetadata interface
  - Entity types

leaderboard.ts
  - ScoreEntry interface
  - LeaderboardData interface
```

---

## Data Flow

### Level Creation Flow

```
1. User clicks entity in palette
   └─> React setState (selectedEntity)

2. User clicks grid cell
   └─> CreateScene.handlePointerDown()
       └─> entities.placeEntity()
           ├─> Create Phaser.Container
           ├─> Add to placedEntities Map
           └─> Update occupiedCells Set

3. User clicks "Save"
   └─> Create.tsx calls scene.getAllEntities()
       └─> Convert to LevelData format
           └─> POST /api/levels
               └─> Redis: HSET levels:{name} data
```

### Gameplay Flow

```
1. User selects level
   └─> Play.tsx loads level name
       └─> PlayScene.init({ levelName })

2. Scene creation
   └─> PlayScene.create()
       ├─> Fetch level data from API
       ├─> json-conversion.loadLevel()
       │   ├─> Create player sprite
       │   ├─> Create platform sprites
       │   ├─> Create hazard/item sprites
       │   └─> Setup physics bodies
       └─> setupCollisions()
           └─> Physics.add.collider/overlap()

3. Game loop (60fps)
   └─> PlayScene.update()
       ├─> controls.getPlayerInput()
       ├─> controls.handlePlayerMovement()
       ├─> enemies.updateEnemyPatrol()
       └─> Check win/lose conditions
```

### Authentication Flow

```
1. User clicks "Login"
   └─> auth.service.login()
       └─> POST /auth/login { username, password }
           └─> Server validates credentials
               ├─> Generate JWT token
               ├─> Store session in Redis
               └─> Return token to client

2. Subsequent API calls
   └─> Add Authorization header
       └─> Middleware validates token
           └─> If expired: refresh token
           └─> If invalid: return 401
```

---

## Data Models

### Level Data Structure

```typescript
interface LevelData {
  version: string;
  metadata: {
    name: string;
    author: string;
    created: string;
    description?: string;
  };
  settings: {
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    physics: {
      gravity: number;
      friction: number;
    };
    camera: {
      zoom: number;
      followPlayer: boolean;
    };
  };
  objects: LevelObject[];
}

interface LevelObject {
  id: string;
  type: 'player' | 'platform' | 'spike' | 'coin' | 'enemy' | 'spring' | 'door' | 'lava';
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: {
    texture?: string;
    patrolLeft?: number;
    patrolRight?: number;
    patrolSpeed?: number;
    [key: string]: any;
  };
}
```

### Redis Data Structure

```
Keys:
- session:{sessionId} → JWT token data (TTL: 24h)
- user:{username}:levels → Set of level names
- level:{levelName} → JSON level data
- level:{levelName}:meta → Level metadata
- leaderboard:{levelName} → Sorted Set (score → username)
```

---

## Key Technical Decisions

### 1. Physics Engine: Phaser Arcade Physics

**Why:**
- Lightweight and performant
- Built-in collision detection
- Sufficient for 2D platformer mechanics

**Trade-offs:**
- Less realistic than Matter.js
- Limited shape support (rectangles mainly)
- No rotation physics

### 2. State Management: React Context + Local State

**Why:**
- Simple for current scope
- No external dependencies
- Easy to understand and debug

**Trade-offs:**
- Not optimal for large-scale apps
- Prop drilling in some cases

### 3. Backend: Redis for Storage

**Why:**
- Fast in-memory database
- Native support in Devvit
- Simple key-value operations
- Built-in sorted sets for leaderboard

**Trade-offs:**
- Data persistence requires snapshots
- Limited query capabilities vs SQL
- Memory usage can be high

### 4. Collision Bodies: Custom Hitboxes

**Why:**
- Precise collision detection
- Better game feel (forgiving spikes, responsive springs)
- Standard in platformers

**Implementation:**
```typescript
// Player: 60x100px body
playerBody.setSize(60, 100);

// Spike: 90% width, 70% height (top portion only)
spikeBody.setSize(width * 0.9, height * 0.7);
spikeBody.setOffset(width * 0.05, (height - height * 0.7) / 2);

// Spring: 110% height (extended top)
springBody.setSize(width, height * 1.1);
springBody.setOffset(0, -(height * 0.1) / 2);
```

### 5. Mobile Controls: Virtual Joystick

**Why:**
- Analog movement (better than D-pad)
- Familiar to mobile gamers
- Doesn't obscure gameplay

**Implementation:**
- Touchable zone in bottom-left
- Visual feedback (circle + knob)
- Normalized vector output (-1 to 1)

---

## Performance Optimizations

### 1. Asset Management
- Preload all assets in scene.preload()
- Use texture atlases for sprites
- Lazy-load audio files

### 2. Entity Culling
- Phaser cameras automatically cull off-screen objects
- Chunk-based level loading for very large levels

### 3. Physics Optimization
- Static bodies for platforms (no velocity calculations)
- Collision groups to reduce checks
- Fixed timestep (60fps)

### 4. Memory Management
- Destroy unused game objects
- Clear event listeners on scene shutdown
- Reuse object pools for particles/effects

---

## Security Considerations

### 1. Input Validation
- Zod schemas validate all level data
- Sanitize user-provided strings
- Limit level size (max objects, max dimensions)

### 2. Authentication
- JWT tokens with expiration
- HttpOnly cookies (if possible)
- CSRF protection

### 3. Rate Limiting
- Max 10 level saves per minute per user
- Max 100 API calls per minute per IP

### 4. XSS Prevention
- React escapes strings by default
- No dangerouslySetInnerHTML usage
- Content Security Policy headers

---

## Deployment Architecture

```
Development:
- Vite dev server (client)
- Node.js local server
- Redis local instance

Production (Devvit):
- Static assets on CDN
- Serverless functions
- Managed Redis
```

---

## Future Architecture Considerations

### Scalability
- Database sharding for levels (by creator)
- CDN for static assets
- WebSocket for real-time multiplayer

### Microservices
- Separate auth service
- Separate level service
- Separate leaderboard service

### Advanced Features
- Level versioning system
- Collaborative editing (OT/CRDT)
- Replay system (record inputs)

