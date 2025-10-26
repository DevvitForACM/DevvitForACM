# 🚀 Server - Redis Backend

This server uses Redis for optimal performance with leaderboards and user authentication.

## 🏗️ Architecture

### **Services:**
- **Redis Service**: Devvit's built-in Redis client
- **Auth Service**: JWT-based authentication with Reddit OAuth
- **Leaderboard Service**: Redis Sorted Sets for optimal performance

### **Data Structure:**
```
Redis Keys:
├── leaderboard:scores (Sorted Set) - User scores for ranking
├── leaderboard:users (Hash) - Username lookup
└── user:{uid} (Hash) - User profile data
```

## 🔧 Setup

1. **Environment Variables** (`.env`):
```env
JWT_SECRET=your_jwt_secret_at_least_32_characters
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_REDIRECT_URI=your_callback_url
```

2. **Build & Deploy**:
```bash
npm run build
npm run deploy
```

## 📊 API Endpoints

### Leaderboard
- `GET /api/leaderboard` - Get top users
- `POST /api/leaderboard/score` - Update user score
- `GET /api/leaderboard/rank/:userId` - Get user rank

### Authentication  
- `GET /auth/reddit/callback?code=...` - Reddit OAuth callback
- `GET /auth/me` - Get authenticated user info

## ⚡ Performance Benefits

- **Leaderboard Operations**: O(log N) with Redis Sorted Sets
- **User Rankings**: Instant rank calculation
- **Score Updates**: Atomic operations
- **Simpler Configuration**: No Firebase service accounts needed