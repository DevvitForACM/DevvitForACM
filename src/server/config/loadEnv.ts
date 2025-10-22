import path from 'path';

// Load environment variables from the project root .env file (if present).
// We explicitly resolve the path from process.cwd() so running from other folders still works.
try {
  // Use require so this module can be imported from both ESM/TS and CommonJS runtime setups.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const dotenv = require('dotenv');
  const envPath = path.join(process.cwd(), '.env');
  dotenv.config({ path: envPath });
  // It's useful to log once in dev so maintainers know where env was loaded from.
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('✅ Loaded environment from', envPath);
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('dotenv not available - continuing without loading root .env');
}
