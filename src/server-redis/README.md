# 🚀 Redis Server - Complete Firebase Migration

This is the complete Redis-based server following the exact 6-step Firebase to Redis conversion plan.

## ✅ 6-Step Migration Completed

### 1. 📦 Dependencies Updated
- ❌ **Removed**: `firebase-admin`, `firebase`, `node-fetch`
- ✅ **Added**: `axios`, `jsonwebtoken`, `@types/jsonwebtoken`
- ✅ **Uses**: Devvit's built-in Redis (no ioredis needed)

### 2. 🔑 Configuration Updated
- ❌ **Removed**: All `FIREBASE_*` and `GOOGLE_*` keys
- ✅ **Added**: `JWT_SECRET`, Reddit OAuth credentials
- ✅ **No REDIS_URL needed**: Uses Devvit's built-in Redis

### 3. 🔄 Firebase Service Replaced
- ❌ **Deleted**: `firebase-admin.service.ts`
- ✅ **Created**: `redis.service.ts` - Simple export of Devvit Redis client

### 4. 🏎️ Leaderboard Service Rewritten
**Redis Commands Used:**
- `updateScore`: `redis.zAdd(LEADERBOARD_KEY, { member: userId, score })` + `redis.hSet(USER_HASH_KEY, { [userId]: username })`
- `getTopUsers`: `redis.zRange(LEADERBOARD_KEY, 0, limit, { reverse: true, withScores: true })`
- `getUserRank`: `redis.zRank(userId, LEADERBOARD_KEY, { reverse: true })`
- `getTotalPlayers`: `redis.zCard(LEADERBOARD_KEY)`

### 5. 🔒 Authentication Service Rewritten
**New JWT-based Flow:**
1. `createOrGetUserFromReddit`: Uses `axios` for Reddit OAuth
2. `createServerJwt`: Signs JWT with `jsonwebtoken` and `JWT_SECRET`
3. `verifyServerJwt`: Validates JWT tokens
4. User profiles stored in Redis hashes

### 6. 🧹 Controllers & Routes
✅ **No changes needed** - Same API, different backend

## 🏗️ Redis Data Structure

```
Redis Keys:
├── leaderboard:scores (Sorted Set)
│   ├── user1 → score: 1000
│   ├── user2 → score: 850
│   └── user3 → score: 750
├── leaderboard:users (Hash)
│   ├── user1 → "username1"
│   └── user2 → "username2"
└── user:reddit:user1 (Hash)
    ├── username → "username1"
    ├── icon → "https://..."
    ├── email → "user@example.com"
    ├── role → "user"
    └── createdAt → "25 Oct 2025, 14:30:25"
```

## 🔧 Setup Instructions

### 1. Use Redis Configuration Files
```bash
# Copy Redis-specific config files
cp package-redis.json package.json
cp .env-redis .env
cp devvit-redis.yaml devvit.yaml
```

### 2. Update Environment Variables
Edit `.env` with real values:
```env
JWT_SECRET=your_very_long_random_jwt_secret_here_at_least_32_characters
REDDIT_CLIENT_ID=your_actual_reddit_client_id
REDDIT_CLIENT_SECRET=your_actual_reddit_client_secret
REDDIT_REDIRECT_URI=your_actual_callback_url
```

### 3. Install & Build
```bash
npm install
npm run build
```

### 4. Deploy
```bash
npm run deploy
```

## 📊 Performance Comparison

| Operation | Firebase | Redis | Improvement |
|-----------|----------|-------|-------------|
| **Update Score** | `ref().set()` | `zAdd()` | ✅ Atomic operations |
| **Get Top 10** | `query().orderBy().limitToLast()` | `zRange(reverse: true)` | 🚀 O(log N) vs O(N log N) |
| **Get User Rank** | Manual calculation | `zRank()` | 🚀 O(log N) vs O(N) |
| **Total Players** | `Object.keys().length` | `zCard()` | 🚀 O(1) vs O(N) |

## 🔍 Testing Redis

Use the moderator menu action "Redis Test" to verify:
1. Basic Redis operations (`set`/`get`)
2. Leaderboard operations (`zAdd`/`zRange`)
3. Check server logs for results

## 📁 Complete File Structure

```
src/server-redis/
├── services/
│   ├── redis.service.ts          # Devvit Redis client
│   ├── leaderboard.service.ts     # Redis Sorted Sets
│   └── auth.service.ts           # JWT + Redis auth
├── controllers/
│   ├── leaderboard.controller.ts  # Same API
│   └── auth.controller.ts        # Reddit OAuth
├── routes/
│   ├── leaderboard.routes.ts     # Same endpoints
│   └── auth.routes.ts            # Same endpoints
├── middlewares/
│   └── auth.ts                   # JWT verification
├── models/
│   └── leaderboard.ts            # Same models
├── core/
│   └── post.ts                   # Devvit post creation
├── index.ts                      # Main Redis server
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Build config
├── vite.config.local.ts          # Local build config
└── README.md                     # This file
```

## 🎯 API Endpoints (100% Compatible)

### Leaderboard
- `GET /api/leaderboard` - Get top users
- `POST /api/leaderboard/score` - Update user score  
- `GET /api/leaderboard/rank/:userId` - Get user rank

### Authentication
- `GET /auth/reddit/callback?code=...` - Reddit OAuth callback
- `GET /auth/me` - Get authenticated user info
- `GET /auth/status` - Check auth service status

### Testing
- `POST /internal/menu/redis-test` - Test Redis functionality (moderator only)

## 🚀 Benefits Achieved

1. **Simpler Setup**: No Firebase service accounts or complex configuration
2. **Better Performance**: Redis Sorted Sets optimized for leaderboards
3. **Atomic Operations**: Score updates are atomic
4. **Instant Ranking**: O(log N) rank queries
5. **Built-in Devvit Integration**: Uses native Redis service
6. **Same API**: Client code needs no changes

---

🎉 **Migration Complete!** Your server now uses Redis for optimal leaderboard performance!