import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

exports.crearUsuario = functions.https.onCall(async (data, context) => {
  const { email, password, rol, nombre } = data;

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión para crear usuarios');
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombre || undefined,
    });

    await admin.firestore().collection('usuarios').doc(userRecord.uid).set({
      rol,
      nombre,
      email,
    });

    return { uid: userRecord.uid };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});