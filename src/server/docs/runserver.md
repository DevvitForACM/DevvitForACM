step 1: clone the repo

step 2 : npm install

step 3 : initialise env in the root folder. env format :

# Reddit API
REDDIT_CLIENT_ID=<Your_Reddit_Client_ID>
REDDIT_CLIENT_SECRET=<Your_Reddit_Client_Secret>
REDDIT_REDIRECT_URI=http://localhost:3000/auth/reddit/callback

# Firebase (Frontend config)
FIREBASE_API_KEY=<Your_Firebase_API_Key>
FIREBASE_AUTH_DOMAIN=<Your_Firebase_Auth_Domain>
FIREBASE_DATABASE_URL=<Your_Firebase_Database_URL>
FIREBASE_PROJECT_ID=<Your_Firebase_Project_ID>
FIREBASE_STORAGE_BUCKET=<Your_Firebase_Storage_Bucket>
FIREBASE_MESSAGING_SENDER_ID=<Your_Firebase_Messaging_Sender_ID>
FIREBASE_APP_ID=<Your_Firebase_App_ID>
FIREBASE_MEASUREMENT_ID=<Your_Firebase_Measurement_ID>

# Firebase Admin SDK (Service Account)
FIREBASE_PROJECT_ID=<Your_Firebase_Project_ID>
FIREBASE_PRIVATE_KEY_ID=<Your_Firebase_Private_Key_ID>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<Your_Base64_Encoded_Private_Key_With_Newlines_Escaped>\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=<Your_Firebase_Client_Email>
FIREBASE_CLIENT_ID=<Your_Firebase_Client_ID>
FIREBASE_AUTH_URI=[https://accounts.google.com/o/oauth2/auth](https://accounts.google.com/o/oauth2/auth)
FIREBASE_TOKEN_URI=[https://oauth2.googleapis.com/token](https://oauth2.googleapis.com/token)
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=[https://www.googleapis.com/oauth2/v1/certs](https://www.googleapis.com/oauth2/v1/certs)
FIREBASE_CLIENT_X509_CERT_URL=<Your_Firebase_Client_X509_Cert_URL>

# App
JWT_SECRET=<Your_JWT_Secret_Key>
DEVVIT_SUBREDDIT=<Your_Target_Subreddit_e.g., r/testing>
PORT=3000

step 4 : npm run build:server

step 5 : node dist/server/index.cjs