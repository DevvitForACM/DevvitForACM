# Quick Start Guide

## Understanding Settings Warnings

When you run the app, you might see warnings about Firebase or Reddit OAuth settings. This is **normal** and happens because:

1. Your app has settings defined in `devvit.json` for when it's deployed to Reddit
2. These settings need to be configured differently depending on where the app runs:
   - **On Reddit (Devvit)**: Settings are configured through Reddit's UI by subreddit moderators
   - **Locally**: Settings are loaded from your `.env` file

## Your Setup Status ✅

Good news! Your `.env` file is already configured with:
- ✅ Reddit OAuth credentials (Client ID, Secret, Redirect URI)
- ✅ Firebase configuration (API keys, project ID, database URL)
- ✅ Firebase Admin SDK (Private key, Client email)
- ✅ JWT secret for authentication
- ✅ Devvit subreddit (r/please_chal_app_dev)
- ✅ Server port (3000)

## How to Run Locally

### Option 1: Full Development Mode (Recommended)
```bash
npm run dev
```
This starts:
- Client build with hot reload
- Server build with hot reload  
- Devvit playtest environment

**Note**: The `dev:devvit` script automatically sets `SUPPRESS_WARNINGS=true` to reduce noise during development.

### Option 2: Standalone Server (For Backend Testing)
```bash
npm run dev:local
```
This runs just the Express server on http://localhost:3000 without the Devvit playtest environment.

## Why Settings Appear in Two Places

### `devvit.json` Settings
```json
{
  "settings": {
    "global": {
      "firebaseApiKey": { "type": "string", "isSecret": true },
      "redditClientId": { "type": "string", "isSecret": true },
      // ... etc
    }
  }
}
```
These are the **schema** for settings. When your app is installed on Reddit, moderators fill these in through the UI.

### `.env` File
```bash
FIREBASE_API_KEY=AIzaSyB...
REDDIT_CLIENT_ID=UhehDg...
# ... etc
```
These are the **actual values** used during local development.

### How The Code Handles Both

The magic happens in `src/server/variables.ts`:

```typescript
export async function getConfigValue(settingKey: string, envVar: string) {
  // In Devvit context, try settings first
  if (isDevvitContext) {
    const settingValue = await settings.get(settingKey);
    if (settingValue) return String(settingValue);
  }
  
  // Fallback to process.env
  return process.env[envVar] || '';
}
```

When running locally, `isDevvitContext` is `false`, so it uses your `.env` file.

## Deploying to Reddit

When you're ready to deploy:

1. **Build and upload**:
   ```bash
   npm run deploy
   ```

2. **Install to your subreddit**:
   - Go to your test subreddit (r/please_chal_app_dev)
   - Install the app through Reddit's developer portal

3. **Configure settings**:
   - Navigate to the app settings in Reddit's UI
   - Enter the same values from your `.env` file:
     - Firebase API Key
     - Firebase Project ID  
     - Reddit Client ID/Secret
     - JWT Secret
     - etc.

4. **The app will now run on Reddit** using those configured settings!

## Next Steps

1. ✅ **Your environment is ready!** Just run `npm run dev`
2. Test the app locally at http://localhost:3000
3. Review `SERVER_TESTING_GUIDE.md` for detailed backend testing
4. When ready, deploy with `npm run deploy`

## Troubleshooting

### "Settings not configured" warnings
- **Locally**: Make sure `.env` exists and has all required variables
- **On Reddit**: Configure settings through the app settings UI after installation

### Port already in use
```powershell
# Find and kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Firebase connection issues
- Verify `FIREBASE_DATABASE_URL` is correct
- Check that Firebase project has Realtime Database enabled
- Ensure service account has proper permissions

### Reddit OAuth errors
- Verify `REDDIT_REDIRECT_URI` matches exactly in Reddit app settings
- Check that Reddit app is set to "web app" type
- Ensure Client ID and Secret are correct

## Resources

- **Main Documentation**: `WARP.md` - Complete architecture and commands
- **Backend Testing**: `SERVER_TESTING_GUIDE.md` - Detailed API testing guide
- **Devvit Docs**: https://developers.reddit.com/docs
- **Firebase Console**: https://console.firebase.google.com
