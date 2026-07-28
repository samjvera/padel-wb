import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot,
  collection, serverTimestamp, deleteField, writeBatch,
} from 'firebase/firestore';

import { firebaseConfig } from '../config';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

/* ---------- avisos de fallo ----------
   Firestore rechaza escrituras en silencio si las reglas no las permiten.
   Esto hace que cualquier fallo llegue a la pantalla en vez de perderse. */

let avisar = null;
export const alFallar = cb => { avisar = cb; };

const vigilar = promesa => promesa.catch(e => {
  console.error('[Padel] no se pudo guardar:', e);
  avisar?.(e?.code === 'permission-denied'
    ? 'No se pudo guardar: las reglas de Firestore lo están bloqueando. Vuelve a publicarlas (Paso 3 del README).'
    : `No se pudo guardar: ${e?.message || 'error desconocido'}`);
  throw e;
});

/* ---------- jugadores ---------- */

/* ---------- quién soy (guardado en este navegador) ---------- */

const CLAVE = 'padel:yo';
export const leerYo = () => localStorage.getItem(CLAVE);
export const guardarYo = id => localStorage.setItem(CLAVE, id);
export const olvidarYo = () => localStorage.removeItem(CLAVE);

export function watchPlayers(cb, onError) {
  return onSnapshot(collection(db, 'players'), snap => {
    const map = {};
    snap.forEach(d => { map[d.id] = { id: d.id, ...d.data() }; });
    cb(map);
  }, err => onError?.(err));
}

/**
 * Une a alguien al grupo escribiendo su nombre.
 * Si el nombre ya existe (sin distinguir mayúsculas ni acentos) devuelve a esa
 * persona; si es nuevo, lo crea como invitado —fuera de la rotación de pago—.
 */
export async function unirse(nombre, players) {
  const id = nombre.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  if (!id) throw new Error('Escribe un nombre');

  if (players[id]) {
    if (players[id].active === false) {
      await setDoc(doc(db, 'players', id), { active: true }, { merge: true });
    }
    return id;
  }
  await setDoc(doc(db, 'players', id), {
    name: nombre.trim(), gender: null, isGuest: true, active: true,
  });
  return id;
}

export function addGuest(name, gender) {
  const id = `inv_${Date.now().toString(36)}`;
  return setDoc(doc(db, 'players', id), {
    name: name.trim(), gender, isGuest: true, active: true,
  }).then(() => id);
}

export const removeGuest = id => setDoc(doc(db, 'players', id), { active: false }, { merge: true });

/** Configuración inicial: crea los jugadores y el orden de pago. */
export async function crearGrupo(jugadores, ordenPago) {
  const batch = writeBatch(db);
  for (const j of jugadores) {
    batch.set(doc(db, 'players', j.id), {
      name: j.name, gender: j.gender, isGuest: false, active: true,
    });
  }
  batch.set(doc(db, 'meta', 'payments'), { order: ordenPago });
  batch.set(doc(db, 'meta', 'setup'), { done: true, at: serverTimestamp() });
  await vigilar(batch.commit());
}

/* ---------- semana ---------- */

export function watchWeek(wid, cb) {
  return onSnapshot(doc(db, 'weeks', wid), d => {
    cb(d.exists() ? { id: d.id, ...d.data() } : { id: wid, availability: {}, status: 'abierta' });
  });
}

export async function ensureWeek(wid) {
  const ref = doc(db, 'weeks', wid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { availability: {}, status: 'abierta', createdAt: serverTimestamp() });
  }
}

export async function setAvailability(wid, playerId, cellId, value) {
  await ensureWeek(wid);
  const path = `availability.${playerId}.${cellId}`;
  await vigilar(updateDoc(doc(db, 'weeks', wid), { [path]: value ? true : deleteField() }));
}

export async function fijarDia(wid, cid, confirmed, payerId) {
  await vigilar(updateDoc(doc(db, 'weeks', wid), {
    cellId: cid, confirmed, payerId, status: 'fijada', fijadaAt: serverTimestamp(),
  }));
}

export const reabrirSemana = wid =>
  updateDoc(doc(db, 'weeks', wid), { status: 'abierta', cellId: null, confirmed: [], payerId: null });

/* ---------- partido ---------- */

/** Todas las semanas, para saber qué día se jugó cada partida. */
export function watchWeeks(cb) {
  return onSnapshot(collection(db, 'weeks'), snap => {
    const map = {};
    snap.forEach(d => { map[d.id] = d.data(); });
    cb(map);
  }, () => cb({}));
}

/** Todas las partidas jugadas, para el historial. */
export function watchSessions(cb) {
  return onSnapshot(collection(db, 'sessions'), snap => {
    const lista = [];
    snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
    cb(lista.sort((a, b) => b.id.localeCompare(a.id)));
  }, () => cb([]));
}

export function watchSession(wid, cb) {
  return onSnapshot(doc(db, 'sessions', wid), d => cb(d.exists() ? { id: d.id, ...d.data() } : null));
}

export const guardarSesion = (wid, data) =>
  vigilar(setDoc(doc(db, 'sessions', wid), { ...data, createdAt: serverTimestamp() }));

export const guardarResultado = (wid, index, marcador) =>
  vigilar(updateDoc(doc(db, 'sessions', wid), { [`results.${index}`]: marcador }));


/* ---------- cuentas ---------- */

export function watchLedger(cb) {
  return onSnapshot(doc(db, 'meta', 'ledger'), d =>
    cb(d.exists() ? d.data() : { costoNoche: 20, movimientos: [] }));
}

export const guardarLedger = datos =>
  vigilar(setDoc(doc(db, 'meta', 'ledger'), datos, { merge: true }));

/* ---------- pagos ---------- */

export const guardarOrden = order =>
  vigilar(setDoc(doc(db, 'meta', 'payments'), { order }, { merge: true }));

/** Solo guarda el orden de la cola. Los turnos se cuentan de las partidas. */
export function watchPayments(cb) {
  return onSnapshot(doc(db, 'meta', 'payments'), d => cb(d.exists() ? d.data() : {}));
}
