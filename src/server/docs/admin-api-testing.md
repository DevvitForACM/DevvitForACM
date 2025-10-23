# Admin API Testing Guide - Hoppscotch

This guide provides step-by-step instructions for testing the Admin User Management API endpoints using Hoppscotch.

## Prerequisites

1. **Server Running**: Ensure your local server is running on `http://localhost:3000`
2. **Admin User**: You need an admin user account to test these endpoints
3. **Hoppscotch**: Install Hoppscotch or use the web version at https://hoppscotch.io

## Authentication Setup

### Step 1: Get Admin JWT Token

Before testing admin endpoints, you need a valid JWT token from an admin user.

**Method 1: Through Reddit OAuth (Recommended)**
1. Navigate to `http://localhost:3000/auth/reddit` in your browser
2. Complete Reddit OAuth flow
3. Check the response for the JWT token
4. Ensure your user has admin role in Firebase Database

**Method 2: Manual Token Generation (For Testing)**
If you have direct database access, you can manually create an admin user and generate a token.

### Step 2: Configure Hoppscotch Environment

1. Open Hoppscotch
2. Go to Environments tab
3. Create a new environment called "Admin API Local"
4. Add these variables:
   - `baseURL`: `http://localhost:3000`
   - `adminToken`: `your-jwt-token-here`

## API Endpoints Testing

### 1. Get All Users

**Endpoint**: `GET /api/admin/users`

**Hoppscotch Configuration**:
- Method: `GET`
- URL: `{{baseURL}}/api/admin/users`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "username": "testuser1",
      "email": "user1@example.com",
      "role": "user",
      "icon": "https://example.com/icon.png",
      "createdAt": "2024-01-15 10:30:45"
    }
  ],
  "count": 1
}
```

**Error Cases to Test**:
- Missing Authorization header (401)
- Invalid token (401)
- Non-admin user token (403)
### 2. Get User by Firebase UID

**Endpoint**: `GET /api/admin/users/:firebaseUid`

**Hoppscotch Configuration**:
- Method: `GET`
- URL: `{{baseURL}}/api/admin/users/reddit:1zyfbtxovw`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "username": "Head_Ebb_9856",
    "email": "user1@example.com",
    "role": "user",
    "icon": "https://www.redditstatic.com/avatars/...",
    "createdAt": "23 Oct 2025, 12:51:14"
  }
}
```

**Error Cases to Test**:
- User not found (404)
- Invalid Firebase UID parameter (400)
- Firebase UID too long (>50 chars) (400)

### 3. Delete User

**Endpoint**: `DELETE /api/admin/users/:firebaseUid`

**Hoppscotch Configuration**:
- Method: `DELETE`
- URL: `{{baseURL}}/api/admin/users/reddit:1zyfbtxovw`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- Body (JSON):
```json
{
  "reason": "Violation of community guidelines"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "User has been deleted successfully",
  "deletedBy": "admin_username",
  "reason": "Violation of community guidelines"
}
```

**What Happens**:
- User data is deleted from Firebase using the UID key
- Reddit DM is sent to the actual username (e.g., "Head_Ebb_9856")
- User data is archived in Firestore for audit trail

**Error Cases to Test**:
- Missing reason in body (400)
- Empty reason string (400)
- User not found (404)
- Attempting to delete last admin (400)

### 4. Update User Role

**Endpoint**: `PUT /api/admin/users/:firebaseUid/role`

**Hoppscotch Configuration**:
- Method: `PUT`
- URL: `{{baseURL}}/api/admin/users/reddit:1zyfbtxovw/role`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- Body (JSON):
```json
{
  "role": "admin"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "username": "Head_Ebb_9856",
    "email": "user1@example.com",
    "role": "admin",
    "icon": "https://www.redditstatic.com/avatars/...",
    "createdAt": "23 Oct 2025, 12:51:14"
  }
}
```

**Error Cases to Test**:
- Invalid role value (400)
- Missing role in body (400)
- User not found (404)
- Demoting last admin (400)
- User already has the specified role (400)## Test
ing Scenarios

### Scenario 1: Complete User Management Workflow

1. **List all users** - `GET /api/admin/users`
2. **Get specific user** - `GET /api/admin/users/testuser1`
3. **Promote user to admin** - `PUT /api/admin/users/testuser1/role` (role: "admin")
4. **Demote admin to user** - `PUT /api/admin/users/testuser1/role` (role: "user")
5. **Delete user** - `DELETE /api/admin/users/testuser1` (with reason)

### Scenario 2: Error Handling Tests

1. **Test without auth header**:
   - Remove Authorization header
   - Expect 401 Unauthorized

2. **Test with invalid token**:
   - Use `Authorization: Bearer invalid-token`
   - Expect 401 Invalid Token

3. **Test with non-admin user**:
   - Use token from user with role "user"
   - Expect 403 Insufficient Privileges

4. **Test parameter validation**:
   - Use username longer than 50 characters
   - Expect 400 Invalid Username

5. **Test business logic**:
   - Try to delete the last admin user
   - Expect 400 error preventing deletion

### Scenario 3: Edge Cases

1. **Empty database**: Test when no users exist
2. **Malformed JSON**: Send invalid JSON in request body
3. **Missing required fields**: Omit required fields like "reason" for deletion
4. **Special characters**: Test usernames with special characters

## Hoppscotch Collection Setup

### Creating a Collection

1. In Hoppscotch, go to Collections
2. Create new collection: "Admin User Management API"
3. Add folders for each endpoint type:
   - User Retrieval
   - User Management
   - Error Testing

### Sample Collection Structure

```
Admin User Management API/
├── User Retrieval/
│   ├── Get All Users
│   └── Get User by Username
├── User Management/
│   ├── Delete User
│   └── Update User Role
└── Error Testing/
    ├── Unauthorized Access
    ├── Invalid Token
    ├── Non-Admin User
    └── Parameter Validation
```

## Environment Variables for Testing

Create different environments for different scenarios:

### Local Development
```
baseURL: http://localhost:3000
adminToken: your-admin-jwt-token
userToken: your-user-jwt-token
testUsername: testuser1
```

### Production Testing
```
baseURL: https://your-production-url.com
adminToken: production-admin-token
userToken: production-user-token
testUsername: prod-testuser
```## Quick St
art Checklist

### Before Testing
- [ ] Server is running on `http://localhost:3000`
- [ ] Firebase is configured and connected
- [ ] You have at least one admin user in the database
- [ ] You have obtained a valid JWT token for the admin user
- [ ] Hoppscotch is set up with the environment variables

### Testing Steps
1. [ ] Test authentication (verify admin token works)
2. [ ] Test GET /api/admin/users (list all users)
3. [ ] Test GET /api/admin/users/:username (get specific user)
4. [ ] Test PUT /api/admin/users/:username/role (update role)
5. [ ] Test DELETE /api/admin/users/:username (delete user)
6. [ ] Test error scenarios (unauthorized, invalid params, etc.)

### Verification
- [ ] All endpoints return expected response formats
- [ ] Error responses include proper error codes and messages
- [ ] Admin middleware properly validates authentication
- [ ] Business logic prevents deletion of last admin
- [ ] Reddit DM notifications are sent (check logs)
- [ ] Deleted users are archived in Firestore

## Common Issues and Solutions

### Issue: 401 Unauthorized
**Cause**: Missing or invalid JWT token
**Solution**: 
1. Verify the Authorization header format: `Bearer <token>`
2. Check if the token is expired (tokens expire after 7 days)
3. Ensure the token was generated correctly

### Issue: 403 Insufficient Privileges
**Cause**: User doesn't have admin role
**Solution**:
1. Check user's role in Firebase Database
2. Manually update user role to "admin" if needed
3. Verify the JWT token contains the correct user ID

### Issue: 500 Internal Server Error
**Cause**: Database connection or service issues
**Solution**:
1. Check server logs for detailed error messages
2. Verify Firebase configuration
3. Ensure all required environment variables are set

### Issue: Reddit notifications not working
**Cause**: Reddit client not available or service issues
**Solution**:
1. Ensure running in Devvit context (notifications only work in Devvit, not standalone)
2. Check server logs for Reddit API errors
3. Verify Reddit client permissions for sending private messages

## Server Health Check

Before testing admin endpoints, verify the server is healthy:

**Endpoint**: `GET /health`
**URL**: `http://localhost:3000/health`

**Expected Response**:
```json
{
  "status": "ok",
  "message": "Standalone server running",
  "port": 3000,
  "firebase": {
    "database": "connected",
    "firestore": "connected",
    "auth": "connected"
  }
}
```

## Next Steps

After successful testing:
1. Document any issues found during testing
2. Create automated tests based on these manual test cases
3. Set up CI/CD pipeline with API testing
4. Consider implementing rate limiting for production
5. Add monitoring and logging for admin actions

---

**Note**: Always test in a development environment first. Never test destructive operations (like user deletion) on production data without proper backups and safeguards.