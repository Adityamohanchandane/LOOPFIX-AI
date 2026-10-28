import { existsSync } from 'node:fs';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const hasProjectId = Boolean(projectId);
const hasCredentialsPath = Boolean(credentialsPath);

if (hasProjectId !== hasCredentialsPath) {
  throw new Error(
    'Configure both FIREBASE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS, or neither to use demo mode.'
  );
}

if (credentialsPath && !existsSync(credentialsPath)) {
  throw new Error(`Firebase service-account file was not found at ${credentialsPath}`);
}

let firestore = null;
let isConfigured = false;

if (projectId && credentialsPath) {
  const app = getApps().find((firebaseApp) => firebaseApp.name === 'loopfix-ai')
    || initializeApp({
      credential: applicationDefault(),
      projectId,
    }, 'loopfix-ai');

  firestore = getFirestore(app);
  isConfigured = true;
  console.log('[Firestore] Admin client initialized');
} else {
  console.warn('[Firestore] Not configured — running in demo mode');
}

export { firestore, isConfigured };
