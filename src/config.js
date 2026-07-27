// ─────────────────────────────────────────────────────────────
//  PEGA AQUÍ LOS DATOS DE TU PROYECTO DE FIREBASE
//  (Paso 5 del README). Reemplaza solo lo que está entre comillas.
//
//  Estos datos NO son secretos: van dentro de la página web y
//  cualquiera puede verlos. Lo que protege tu información son las
//  reglas de Firestore y la lista de correos autorizados.
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "PEGA_AQUI_TU_API_KEY",
  authDomain: "PEGA_AQUI.firebaseapp.com",
  projectId: "PEGA_AQUI",
  storageBucket: "PEGA_AQUI.firebasestorage.app",
  messagingSenderId: "PEGA_AQUI",
  appId: "PEGA_AQUI",
};

export const configurado = !firebaseConfig.apiKey.startsWith("PEGA_AQUI");
