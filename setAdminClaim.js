import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'nns1iuzUqwMFr02jLSFWgsSArYo1'; // reemplaza por el UID correcto

async function setAdmin() {
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`Claim admin asignado al usuario ${uid}`);
    process.exit(0);
  } catch (error) {
    console.error('Error asignando claim:', error);
    process.exit(1);
  }
}

setAdmin();
