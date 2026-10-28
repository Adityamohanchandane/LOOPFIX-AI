import { existsSync, readFileSync } from 'node:fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
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

let serviceAccount = null;
if (credentialsPath) {
  try {
    serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'));
  } catch {
    throw new Error(
      'Firebase credentials file must contain the downloaded service-account JSON, not the Firebase web app config code.'
    );
  }

  if (
    serviceAccount.type !== 'service_account'
    || !serviceAccount.project_id
    || !serviceAccount.client_email
    || !serviceAccount.private_key
  ) {
    throw new Error(
      'Firebase credentials file is not a valid service-account JSON. Download a private key from Firebase Project settings → Service accounts.'
    );
  }

  if (serviceAccount.project_id !== projectId) {
    throw new Error('FIREBASE_PROJECT_ID does not match the service-account project_id.');
  }
}

let firestore = null;
let isConfigured = false;

if (projectId && credentialsPath) {
  const app = getApps().find((firebaseApp) => firebaseApp.name === 'loopfix-ai')
    || initializeApp({
      credential: cert(serviceAccount),
      projectId,
    }, 'loopfix-ai');

  firestore = getFirestore(app);
  isConfigured = true;
  console.log('[Firestore] Admin client initialized');
} else {
  console.warn('[Firestore] Not configured — running in demo mode');
}

export { firestore, isConfigured };
