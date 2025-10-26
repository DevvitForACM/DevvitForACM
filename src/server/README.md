# 🚀 Server - Redis Backend

A lightweight, high-performance backend built with **TypeScript**, **Express**, and **Redis** for the Devvit game.  
Designed for scalability and simplicity — ideal for handling game state, user authentication, and leaderboards.

---

## 🧱 Project Overview

This backend uses **Devvit's built-in capabilities** focusing on:
- Real-time game state updates with Redis
- Low-latency data access via Redis
- Devvit native authentication (no external OAuth setup)
- Simple, modular TypeScript architecture
- Easy Redis integration with Devvit platform

---

## 🏗️ Current Structure

```
src/server/
├── index.ts              # Main server entry point with all routes
├── core/
│   └── post.ts           # Devvit post creation utilities
├── routes/
│   └── auth.routes.ts    # Authentication routes using Devvit native auth
└── services/
    └── redis.service.ts  # Redis client export (Devvit's built-in Redis)
```

### 🧩 Folder Breakdown

| Folder | Description |
|--------|-------------|
| **index.ts** | Main Express server setup with routes for init, increment, decrement, and post creation |
| **routes/** | Authentication routes using `reddit.getCurrentUsername()` for Devvit-native auth |
| **services/** | Redis client (uses Devvit's built-in Redis via `@devvit/web/server`) |
| **core/** | Low-level Devvit post creation and management |

---

## ⚙️ How It Works

This server leverages **Devvit's native platform features**:

### Authentication Flow
1. User accesses the app through Reddit
2. Devvit automatically handles authentication via `reddit.getCurrentUsername()`
3. Server creates/updates user profile in Redis
4. No external OAuth setup required!

### Data Flow
```
Client Request → Express Server → Devvit Context (reddit, redis) → Response
```

**Key Points:**
- ✅ Uses Devvit's built-in Redis (no external connection needed)
- ✅ Uses Devvit's native Reddit authentication
- ✅ No configuration files or environment variables needed
- ✅ All routes have access to Reddit user context via `reddit.getCurrentUsername()`

---

## 🗄️ Redis Data Structure

Redis Keys (managed by Devvit):
```
count (String) - Simple counter value
user:{username} (Hash) - User profile data
  - username: string
  - uid: string
  - avatar: string
  - createdAt: timestamp
  - lastLogin: timestamp
```

---

## 📊 API Endpoints

### Game State
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/init` | Initialize game state |
| POST | `/api/increment` | Increment counter |
| POST | `/api/decrement` | Decrement counter |

### Authentication (Devvit Native)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current authenticated user |
| POST | `/api/auth/login` | Initialize user profile in Redis |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/profile/:username` | Get user profile from Redis |

### Internal (Devvit)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/internal/on-app-install` | Create post on app install |
| POST | `/internal/menu/post-create` | Create post from menu |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

---

## 🔧 Setup & Development

**No configuration needed!** Devvit handles everything:

1. **Install dependencies:**
```bash
npm install
```

2. **Development mode:**
```bash
npm run dev
# Runs: client build, server build, and devvit playtest concurrently
```

3. **Build for production:**
```bash
npm run build
```

4. **Deploy to Devvit:**
```bash
npm run deploy
```

---

## 🎮 Client Integration

The client-side authentication service (`src/client/services/auth.service.ts`) communicates with these endpoints:

- `GET /api/auth/me` - Check if user is authenticated
- `POST /api/auth/login` - Authenticate and create user profile
- `POST /api/auth/logout` - Logout user

The client uses React with Phaser for the game engine.

---

## ⚡ Key Features

### Why This Structure is Optimal

1. **Devvit Native Auth**: Uses `reddit.getCurrentUsername()` - no OAuth configuration
2. **Redis Built-in**: Devvit provides Redis client via `@devvit/web/server`
3. **Minimal Overhead**: No external services or configuration files
4. **Type-Safe**: Full TypeScript support with Devvit types
5. **Simple Routing**: All main routes in `index.ts` for easy navigation

### What Was Removed (Cleanup)

- ❌ External Reddit OAuth flow (not needed - Devvit handles it)
- ❌ Firebase dependencies (replaced with Redis)
- ❌ JWT middleware (using Devvit's built-in auth)
- ❌ External service configuration

---

## 👥 Development Guidelines

1. **Keep it simple**: Use Devvit's built-in features first
2. **No external OAuth**: Devvit handles all authentication
3. **Redis for everything**: User data, game state, etc.
4. **TypeScript throughout**: Ensure type safety
5. **Routes in index.ts**: Main routes stay in the entry point for clarity

---

## 🚀 Performance Highlights

- Instant Redis operations via Devvit's optimized client
- No external dependencies or API calls for auth
- Built-in Devvit context for user information
- Low memory footprint with compact data structures
- No Firebase credentials or overhead

---

## 📘 Example: Adding a New Feature

Let's say you want to add a leaderboard system:

1. Add Redis operations in `index.ts`:
```typescript
router.get('/api/leaderboard', async (req, res) => {
  const scores = await redis.zRange('leaderboard:scores', 0, -1);
  res.json({ scores });
});
```

2. Use Devvit's Redis client (no configuration needed)
3. Access current user via `reddit.getCurrentUsername()`
4. Deploy - that's it!

---

## 🔍 Current Implementation

- ✅ Server uses Devvit's Redis (`redis` from `@devvit/web/server`)
- ✅ Authentication uses `reddit.getCurrentUsername()`
- ✅ No external dependencies for auth
- ✅ All routes have access to Reddit context
- ✅ Client communicates via standard fetch API
