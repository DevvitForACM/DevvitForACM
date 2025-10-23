# Admin Level Management API Testing Guide - Hoppscotch

This guide provides step-by-step instructions for testing the Admin Level Management API endpoints using Hoppscotch.

## Prerequisites

1. **Server Running**: Ensure your local server is running on `http://localhost:3000`
2. **Admin User**: You need an admin user account to test these endpoints
3. **Hoppscotch**: Install Hoppscotch or use the web version at https://hoppscotch.io
4. **Test Data**: Some levels in the database for testing retrieval and modification operations

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
3. Create a new environment called "Admin Level API Local"
4. Add these variables:
   - `baseURL`: `http://localhost:3000`
   - `adminToken`: `your-jwt-token-here`
   - `testLevelId`: `sample-level-id-for-testing`
   - `testUserId`: `sample-user-id-for-testing`

## API Endpoints Testing

### 1. Get Level Statistics

**Endpoint**: `GET /api/admin/levels/statistics`

**Hoppscotch Configuration**:
- Method: `GET`
- URL: `{{baseURL}}/api/admin/levels/statistics`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`

**Query Parameters (Optional)**:
- `dateFrom`: `2024-01-01` (ISO date string)
- `dateTo`: `2024-12-31` (ISO date string)

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalLevels": 150,
    "publicLevels": 120,
    "privateLevels": 30,
    "levelsByDifficulty": {
      "easy": 45,
      "medium": 60,
      "hard": 30,
      "unknown": 15
    },
    "levelsByDateRange": {
      "2024-01": 25,
      "2024-02": 30,
      "2024-03": 35
    },
    "topCreators": [
      {
        "userId": "reddit:user123",
        "levelCount": 15
      }
    ],
    "mostPopularLevels": [
      {
        "id": "level-123",
        "plays": 500,
        "likes": 45
      }
    ],
    "averageEngagement": {
      "plays": 25,
      "likes": 3
    }
  },
  "dateRange": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  },
  "message": "Level statistics retrieved successfully",
  "generatedAt": "2024-10-23T10:30:00.000Z"
}
```

**Error Cases to Test**:
- Missing Authorization header (401)
- Invalid token (401)
- Non-admin user token (403)
- Invalid date format (400)

### 2. Get All Public Levels

**Endpoint**: `GET /api/admin/levels/public`

**Hoppscotch Configuration**:
- Method: `GET`
- URL: `{{baseURL}}/api/admin/levels/public`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`

**Query Parameters (Optional)**:
- `difficulty`: `easy` | `medium` | `hard`
- `tags`: `puzzle,adventure` (comma-separated)
- `dateFrom`: `2024-01-01`
- `dateTo`: `2024-12-31`
- `sortBy`: `createdAt` | `plays` | `likes` | `name`
- `sortOrder`: `asc` | `desc`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "level-123",
      "name": "Amazing Puzzle Level",
      "description": "A challenging puzzle level",
      "isPublic": true,
      "plays": 150,
      "likes": 25,
      "metadata": {
        "createdBy": "reddit:user123",
        "createdAt": "2024-10-20T10:00:00.000Z",
        "difficulty": "medium",
        "tags": ["puzzle", "adventure"]
      }
    }
  ],
  "count": 1,
  "filters": {
    "difficulty": "medium",
    "sortBy": "createdAt",
    "sortOrder": "desc"
  },
  "message": "Retrieved 1 public levels with applied filters"
}
```

### 3. Get Level by ID

**Endpoint**: `GET /api/admin/levels/:id`

**Hoppscotch Configuration**:
- Method: `GET`
- URL: `{{baseURL}}/api/admin/levels/{{testLevelId}}`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "level-123",
    "name": "Test Level",
    "description": "A test level for admin access",
    "isPublic": false,
    "plays": 50,
    "likes": 10,
    "metadata": {
      "createdBy": "reddit:user123",
      "createdAt": "2024-10-20T10:00:00.000Z",
      "difficulty": "easy",
      "tags": ["test"]
    }
  },
  "message": "Level retrieved successfully (private)"
}
```

**Error Cases to Test**:
- Level not found (404)
- Invalid level ID parameter (400)
- Empty level ID (400)

### 4. Get Levels by User

**Endpoint**: `GET /api/admin/levels/user/:userId`

**Hoppscotch Configuration**:
- Method: `GET`
- URL: `{{baseURL}}/api/admin/levels/user/{{testUserId}}`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "level-123",
      "name": "User's Level 1",
      "isPublic": true,
      "plays": 100,
      "likes": 15,
      "metadata": {
        "createdBy": "reddit:user123",
        "createdAt": "2024-10-20T10:00:00.000Z"
      }
    },
    {
      "id": "level-124",
      "name": "User's Private Level",
      "isPublic": false,
      "plays": 5,
      "likes": 1,
      "metadata": {
        "createdBy": "reddit:user123",
        "createdAt": "2024-10-19T15:30:00.000Z"
      }
    }
  ],
  "count": 2,
  "userId": "reddit:user123",
  "message": "Retrieved 2 levels for user reddit:user123"
}
```

### 5. Update Level

**Endpoint**: `PATCH /api/admin/levels/:id`

**Hoppscotch Configuration**:
- Method: `PATCH`
- URL: `{{baseURL}}/api/admin/levels/{{testLevelId}}`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- Body (JSON):
```json
{
  "name": "Updated Level Name",
  "description": "Updated description by admin",
  "isPublic": true,
  "metadata": {
    "difficulty": "hard",
    "tags": ["updated", "admin-modified"]
  }
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Level updated successfully",
  "levelId": "level-123",
  "updatedFields": ["name", "description", "isPublic", "metadata"],
  "updatedBy": "admin_username"
}
```

**Error Cases to Test**:
- Level not found (404)
- No update data provided (400)
- Invalid level ID (400)
- Protected fields in update (id, plays, likes) - should be ignored

### 6. Delete Level

**Endpoint**: `DELETE /api/admin/levels/:id`

**Hoppscotch Configuration**:
- Method: `DELETE`
- URL: `{{baseURL}}/api/admin/levels/{{testLevelId}}`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Level deleted successfully",
  "levelId": "level-123",
  "deletedBy": "admin_username"
}
```

**Error Cases to Test**:
- Level not found (404)
- Invalid level ID (400)

### 7. Bulk Delete Levels

**Endpoint**: `POST /api/admin/levels/bulk-delete`

**Hoppscotch Configuration**:
- Method: `POST`
- URL: `{{baseURL}}/api/admin/levels/bulk-delete`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- Body (JSON):
```json
{
  "levelIds": ["level-123", "level-124", "level-125"]
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Bulk delete operation completed",
  "data": {
    "successful": ["level-123", "level-124"],
    "failed": [
      {
        "id": "level-125",
        "error": "Level not found"
      }
    ],
    "totalProcessed": 3
  },
  "summary": {
    "totalRequested": 3,
    "successful": 2,
    "failed": 1
  },
  "deletedBy": "admin_username"
}
```

**Error Cases to Test**:
- Missing levelIds array (400)
- Empty levelIds array (400)
- Invalid level IDs (non-string values) (400)

### 8. Bulk Update Visibility

**Endpoint**: `POST /api/admin/levels/bulk-visibility`

**Hoppscotch Configuration**:
- Method: `POST`
- URL: `{{baseURL}}/api/admin/levels/bulk-visibility`
- Headers:
  - `Authorization`: `Bearer {{adminToken}}`
  - `Content-Type`: `application/json`
- Body (JSON):
```json
{
  "levelIds": ["level-123", "level-124", "level-125"],
  "isPublic": true
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Bulk visibility update operation completed",
  "data": {
    "successful": ["level-123", "level-124"],
    "failed": [
      {
        "id": "level-125",
        "error": "Level not found"
      }
    ],
    "totalProcessed": 3
  },
  "summary": {
    "totalRequested": 3,
    "successful": 2,
    "failed": 1,
    "newVisibility": "public"
  },
  "updatedBy": "admin_username"
}
```

**Error Cases to Test**:
- Missing levelIds array (400)
- Missing isPublic boolean (400)
- Empty levelIds array (400)
- Invalid level IDs (400)

## Testing Scenarios

### Scenario 1: Complete Level Management Workflow

1. **Get statistics** - `GET /api/admin/levels/statistics`
2. **List public levels** - `GET /api/admin/levels/public`
3. **Get specific level** - `GET /api/admin/levels/:id`
4. **Update level** - `PATCH /api/admin/levels/:id`
5. **Get user's levels** - `GET /api/admin/levels/user/:userId`
6. **Bulk update visibility** - `POST /api/admin/levels/bulk-visibility`
7. **Delete single level** - `DELETE /api/admin/levels/:id`
8. **Bulk delete levels** - `POST /api/admin/levels/bulk-delete`

### Scenario 2: Filtering and Sorting Tests

1. **Filter by difficulty**:
   - `GET /api/admin/levels/public?difficulty=easy`
   - `GET /api/admin/levels/public?difficulty=medium`
   - `GET /api/admin/levels/public?difficulty=hard`

2. **Filter by tags**:
   - `GET /api/admin/levels/public?tags=puzzle`
   - `GET /api/admin/levels/public?tags=puzzle,adventure`

3. **Filter by date range**:
   - `GET /api/admin/levels/public?dateFrom=2024-01-01&dateTo=2024-12-31`

4. **Sort by different fields**:
   - `GET /api/admin/levels/public?sortBy=plays&sortOrder=desc`
   - `GET /api/admin/levels/public?sortBy=likes&sortOrder=desc`
   - `GET /api/admin/levels/public?sortBy=name&sortOrder=asc`

5. **Statistics with date range**:
   - `GET /api/admin/levels/statistics?dateFrom=2024-01-01&dateTo=2024-06-30`

### Scenario 3: Error Handling Tests

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
   - Use empty level ID: `GET /api/admin/levels/`
   - Use invalid date format: `GET /api/admin/levels/statistics?dateFrom=invalid-date`
   - Expect 400 validation errors

5. **Test bulk operation validation**:
   - Send empty levelIds array
   - Send non-array levelIds
   - Send invalid level ID types
   - Expect 400 validation errors

### Scenario 4: Edge Cases

1. **Empty database**: Test when no levels exist
2. **Malformed JSON**: Send invalid JSON in request body
3. **Missing required fields**: Omit required fields in bulk operations
4. **Large bulk operations**: Test with many level IDs (50+)
5. **Mixed success/failure**: Test bulk operations with some valid and some invalid IDs

## Hoppscotch Collection Setup

### Creating a Collection

1. In Hoppscotch, go to Collections
2. Create new collection: "Admin Level Management API"
3. Add folders for each endpoint type:
   - Level Retrieval
   - Level Management
   - Bulk Operations
   - Statistics
   - Error Testing

### Sample Collection Structure

```
Admin Level Management API/
├── Statistics/
│   ├── Get Level Statistics
│   └── Get Statistics with Date Range
├── Level Retrieval/
│   ├── Get All Public Levels
│   ├── Get Level by ID
│   └── Get Levels by User
├── Level Management/
│   ├── Update Level
│   └── Delete Level
├── Bulk Operations/
│   ├── Bulk Delete Levels
│   └── Bulk Update Visibility
├── Filtering & Sorting/
│   ├── Filter by Difficulty
│   ├── Filter by Tags
│   ├── Filter by Date Range
│   └── Sort by Different Fields
└── Error Testing/
    ├── Unauthorized Access
    ├── Invalid Parameters
    ├── Bulk Operation Validation
    └── Edge Cases
```

## Environment Variables for Testing

Create different environments for different scenarios:

### Local Development
```
baseURL: http://localhost:3000
adminToken: your-admin-jwt-token
userToken: your-user-jwt-token
testLevelId: existing-level-id-for-testing
testUserId: existing-user-id-for-testing
```

### Production Testing
```
baseURL: https://your-production-url.com
adminToken: production-admin-token
userToken: production-user-token
testLevelId: prod-level-id
testUserId: prod-user-id
```

## Quick Start Checklist

### Before Testing
- [ ] Server is running on `http://localhost:3000`
- [ ] Firebase is configured and connected
- [ ] You have at least one admin user in the database
- [ ] You have obtained a valid JWT token for the admin user
- [ ] You have some test levels in the database
- [ ] Hoppscotch is set up with the environment variables

### Testing Steps
1. [ ] Test authentication (verify admin token works)
2. [ ] Test GET /api/admin/levels/statistics (level statistics)
3. [ ] Test GET /api/admin/levels/public (public levels)
4. [ ] Test GET /api/admin/levels/:id (specific level)
5. [ ] Test GET /api/admin/levels/user/:userId (user's levels)
6. [ ] Test PATCH /api/admin/levels/:id (update level)
7. [ ] Test DELETE /api/admin/levels/:id (delete level)
8. [ ] Test POST /api/admin/levels/bulk-delete (bulk delete)
9. [ ] Test POST /api/admin/levels/bulk-visibility (bulk visibility)
10. [ ] Test filtering and sorting options
11. [ ] Test error scenarios (unauthorized, invalid params, etc.)

### Verification
- [ ] All endpoints return expected response formats
- [ ] Error responses include proper error codes and messages
- [ ] Admin middleware properly validates authentication
- [ ] Parameter validation works correctly
- [ ] Bulk operations handle partial failures gracefully
- [ ] Filtering and sorting work as expected
- [ ] Statistics calculations are accurate

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

### Issue: 404 Level Not Found
**Cause**: Level ID doesn't exist in database
**Solution**:
1. Verify the level ID exists in Firebase Database
2. Check if the level was previously deleted
3. Use a valid level ID from the database

### Issue: 400 Validation Error
**Cause**: Invalid request parameters or body
**Solution**:
1. Check parameter format (level IDs should be strings)
2. Verify required fields are present in request body
3. Ensure date formats are valid ISO strings
4. Check that arrays are not empty when required

### Issue: 500 Internal Server Error
**Cause**: Database connection or service issues
**Solution**:
1. Check server logs for detailed error messages
2. Verify Firebase configuration
3. Ensure all required environment variables are set
4. Check database connectivity

### Issue: Bulk operations partially failing
**Cause**: Some level IDs are invalid or don't exist
**Solution**:
1. This is expected behavior - check the response for details
2. Review the `failed` array in the response for specific errors
3. Verify all level IDs exist before bulk operations

## Server Health Check

Before testing admin level endpoints, verify the server is healthy:

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

## Sample Test Data Setup

To properly test the admin level endpoints, you'll need some test data in your Firebase Database. Here's a sample structure:

### Sample Levels in Firebase Database
```json
{
  "levels": {
    "level-123": {
      "id": "level-123",
      "name": "Test Public Level",
      "description": "A public level for testing",
      "isPublic": true,
      "plays": 150,
      "likes": 25,
      "metadata": {
        "createdBy": "reddit:user123",
        "createdAt": "2024-10-20T10:00:00.000Z",
        "difficulty": "medium",
        "tags": ["puzzle", "adventure"]
      }
    },
    "level-124": {
      "id": "level-124",
      "name": "Test Private Level",
      "description": "A private level for testing",
      "isPublic": false,
      "plays": 50,
      "likes": 5,
      "metadata": {
        "createdBy": "reddit:user123",
        "createdAt": "2024-10-19T15:30:00.000Z",
        "difficulty": "easy",
        "tags": ["test"]
      }
    },
    "level-125": {
      "id": "level-125",
      "name": "Another User's Level",
      "description": "Level by different user",
      "isPublic": true,
      "plays": 200,
      "likes": 30,
      "metadata": {
        "createdBy": "reddit:user456",
        "createdAt": "2024-10-18T12:00:00.000Z",
        "difficulty": "hard",
        "tags": ["challenge", "expert"]
      }
    }
  }
}
```

## Next Steps

After successful testing:
1. Document any issues found during testing
2. Create automated tests based on these manual test cases
3. Set up CI/CD pipeline with API testing
4. Consider implementing rate limiting for production
5. Add monitoring and logging for admin level actions
6. Implement audit trails for level modifications
7. Consider adding more advanced filtering options
8. Add pagination for large result sets

---

**Note**: Always test in a development environment first. Never test destructive operations (like level deletion) on production data without proper backups and safeguards. The admin level management endpoints bypass normal ownership restrictions, so use them carefully.