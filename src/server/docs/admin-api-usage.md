# Admin API Usage Guide

## Key Concepts

### Database Structure
- **Database Key**: Firebase UID (e.g., `reddit:1zyfbtxovw`)
- **Username Field**: Actual Reddit username (e.g., `Head_Ebb_9856`)
- **Notifications**: Sent to the Reddit username, not the database key

### API Endpoints

All admin endpoints use **Firebase UID** as the URL parameter:

| Endpoint | Parameter | Example |
|----------|-----------|---------|
| `GET /api/admin/users` | - | Lists all users |
| `GET /api/admin/users/:uid` | Firebase UID | `reddit:1zyfbtxovw` |
| `DELETE /api/admin/users/:uid` | Firebase UID | `reddit:1zyfbtxovw` |
| `PUT /api/admin/users/:uid/role` | Firebase UID | `reddit:1zyfbtxovw` |

### Example User Data Structure

```json
{
  "reddit:1zyfbtxovw": {
    "username": "Head_Ebb_9856",
    "email": "",
    "role": "admin",
    "icon": "https://www.redditstatic.com/avatars/...",
    "createdAt": "23 Oct 2025, 12:51:14"
  }
}
```

### Notification Behavior

When deleting a user:
1. **Access**: Use Firebase UID (`reddit:1zyfbtxovw`) to delete from database
2. **Notify**: Send Reddit DM to actual username (`Head_Ebb_9856`)
3. **Archive**: Store deletion record with both identifiers

### Testing Examples

**Get User**:
```
GET /api/admin/users/reddit:1zyfbtxovw
```

**Delete User**:
```
DELETE /api/admin/users/reddit:1zyfbtxovw
Body: { "reason": "Policy violation" }
```

**Update Role**:
```
PUT /api/admin/users/reddit:1zyfbtxovw/role
Body: { "role": "admin" }
```

### Console Output Examples

**Successful Deletion**:
```
✅ Reddit DM sent to u/Head_Ebb_9856 about account deletion
✅ User Head_Ebb_9856 (reddit:1zyfbtxovw) deleted and archived successfully
```

**Standalone Mode**:
```
📨 Reddit DM would be sent to u/Head_Ebb_9856:
Subject: Account Deletion Notification
Message: [deletion notification content]
⚠️ Reddit notification not sent - service not available (standalone mode)
```

This approach ensures proper database access while maintaining correct user notifications.