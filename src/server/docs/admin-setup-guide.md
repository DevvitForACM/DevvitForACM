# Admin API Setup & Testing Guide

## Current Implementation Status ✅

All admin user management features are **COMPLETE** and ready for testing:

- ✅ Admin authentication middleware
- ✅ Firebase service layer for user operations  
- ✅ Email notification service
- ✅ Admin controller with all CRUD operations
- ✅ Admin routes with proper validation
- ✅ Error handling and security measures

## Quick Start Steps

### 1. Start the Server
```bash
cd DevvitForACM
npm run start:local
```

This will start:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:3000`

### 2. Verify Server Health
Open `http://localhost:3000/health` in your browser.
You should see Firebase connection status.

### 3. Create Admin User
You need at least one admin user to test the endpoints:

**Option A: Through Reddit OAuth**
1. Go to `http://localhost:3000/auth/reddit`
2. Complete OAuth flow
3. Manually update user role to "admin" in Firebase Database

**Option B: Direct Database Setup**
1. Open Firebase Console
2. Go to Realtime Database
3. Add a user under `/users/{uid}` with `role: "admin"`

### 4. Get JWT Token
After creating admin user, get the JWT token from the OAuth response or generate one using the auth service.

### 5. Test with Hoppscotch
Follow the detailed testing guide in `admin-api-testing.md`

## Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/users/:username` | Get specific user |
| DELETE | `/api/admin/users/:username` | Delete user |
| PUT | `/api/admin/users/:username/role` | Update user role |

## Security Features

- ✅ JWT token authentication
- ✅ Admin role verification
- ✅ Parameter validation
- ✅ Prevents deletion of last admin
- ✅ Audit trail for deletions
- ✅ Email notifications

## Ready to Test!

Your admin API is fully functional and ready for testing. Use the Hoppscotch guide to test all endpoints systematically.