// ─────────────────────────────────────────────────────────────
//  Datos de conexión con Firebase — proyecto "padel-wb"
//
//  Estos datos NO son secretos: viajan dentro de la página web y
//  cualquiera puede verlos. Así funciona Firebase en el navegador.
//  Lo que limita el daño son las reglas de Firestore.
//
//  Si algún día cambias de proyecto de Firebase, reemplaza estos
//  seis valores por los del proyecto nuevo (README, Paso 4).
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIzaSyA-zJ3-6MpHBfjzSerK6PLp4kNau8Hn5Qg",
  authDomain: "padel-wb.firebaseapp.com",
  projectId: "padel-wb",
  storageBucket: "padel-wb.firebasestorage.app",
  messagingSenderId: "908138909589",
  appId: "1:908138909589:web:49ac9d5a131af0ba5f309c",
};

export const configurado = !firebaseConfig.apiKey.startsWith("PEGA_AQUI");
