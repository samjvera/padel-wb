import { useState } from 'react';
import { crearGrupo } from '../lib/firebase';

// Prefijado con el grupo. Se puede cambiar todo antes de crear.
const INICIAL = [
  { name: 'Ricardo',  email: '', gender: 'M' },
  { name: 'Arturo',   email: '', gender: 'M' },
  { name: 'Enrique',  email: '', gender: 'M' },
  { name: 'Santiago', email: '', gender: 'M' },
  { name: 'Samuel',   email: '', gender: 'M' },
  { name: 'Matias',   email: '', gender: 'M' },
  { name: 'Angela',   email: '', gender: 'F' },
  { name: 'Daniela',  email: '', gender: 'F' },
];

const idDe = n => n.trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '') || 'jugador';

export default function Setup({ user }) {
  const [filas, setFilas] = useState(INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const set = (i, campo, valor) =>
    setFilas(f => f.map((r, k) => (k === i ? { ...r, [campo]: valor } : r)));

  const varones = filas.filter(f => f.gender === 'M' && f.name.trim());

  function mover(nombre, dir) {
    setFilas(f => {
      const idx = f.findIndex(r => r.name === nombre);
      const hombres = f.filter(r => r.gender === 'M');
      const pos = hombres.findIndex(r => r.name === nombre);
      if (pos + dir < 0 || pos + dir >= hombres.length) return f;
      const otro = hombres[pos + dir];
      const idxOtro = f.findIndex(r => r.name === otro.name);
      const copia = [...f];
      [copia[idx], copia[idxOtro]] = [copia[idxOtro], copia[idx]];
      return copia;
    });
  }

  const correosOk = filas.every(f => !f.name.trim() || /.+@.+\..+/.test(f.email.trim()));
  const yoEstoy = filas.some(f => f.email.trim().toLowerCase() === user.email.toLowerCase());
  const listo = correosOk && yoEstoy && filas.some(f => f.name.trim());

  async function crear() {
    setGuardando(true); setError(null);
    try {
      const jugadores = filas.filter(f => f.name.trim()).map(f => ({
        id: idDe(f.name), name: f.name.trim(),
        email: f.email.trim().toLowerCase(), gender: f.gender,
      }));
      await crearGrupo(jugadores, varones.map(v => idDe(v.name)));
    } catch (e) {
      setError(e.message || 'No se pudo guardar. Revisa las reglas de Firestore.');
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-dvh max-w-lg mx-auto px-4 py-8 pb-16">
      <p className="t-eyebrow">Primera vez</p>
      <h1 className="t-display text-3xl mt-1">Crea tu grupo</h1>
      <p className="text-sm text-line/60 mt-3 leading-relaxed">
        Esto se hace una sola vez. Escribe el correo de Google de cada persona:
        es la llave con la que entrarán. Si el correo no es exacto, esa persona
        no podrá abrir la app.
      </p>

      <div className="panel p-3 mt-6 space-y-3">
        {filas.map((f, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] gap-2 pb-3 border-b border-glass/20 last:border-0">
            <input
              className="bg-night/60 border border-glass/50 rounded-lg px-3 py-2 text-sm"
              value={f.name} placeholder="Nombre"
              onChange={e => set(i, 'name', e.target.value)}
            />
            <div className="flex gap-1">
              {['M', 'F'].map(g => (
                <button key={g} onClick={() => set(i, 'gender', g)}
                  className={`chip px-3 ${f.gender === g ? 'bg-flood text-night border-flood' : ''}`}>
                  {g}
                </button>
              ))}
            </div>
            <input
              className="col-span-2 bg-night/60 border border-glass/50 rounded-lg px-3 py-2 text-sm t-num"
              value={f.email} placeholder="correo de Google" inputMode="email"
              onChange={e => set(i, 'email', e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="panel p-4 mt-4">
        <p className="t-eyebrow">Orden para pagar la cancha</p>
        <p className="text-xs text-line/50 mt-1.5">
          Solo los marcados como M. Usa las flechas para reordenar.
        </p>
        <ul className="mt-3">
          {varones.map((v, i) => (
            <li key={v.name} className="flex items-center gap-2 py-2 border-t border-glass/25">
              <span className="t-num text-xs text-line/40 w-4">{i + 1}</span>
              <span className="flex-1 text-sm">{v.name}</span>
              <button className="chip px-2" onClick={() => mover(v.name, -1)} aria-label="Subir">↑</button>
              <button className="chip px-2" onClick={() => mover(v.name, 1)} aria-label="Bajar">↓</button>
            </li>
          ))}
        </ul>
      </div>

      {!yoEstoy && (
        <p className="text-xs text-flood mt-4 leading-relaxed">
          Tu correo ({user.email}) todavía no está en la lista. Ponlo en una de
          las filas o no podrás volver a entrar.
        </p>
      )}
      {!correosOk && (
        <p className="text-xs text-flood mt-2">Hay un correo mal escrito.</p>
      )}
      {error && <p className="text-xs text-flood mt-2">{error}</p>}

      <button className="btn btn-flood w-full mt-6" disabled={!listo || guardando} onClick={crear}>
        {guardando ? 'Creando…' : 'Crear el grupo'}
      </button>
      <p className="text-xs text-line/45 mt-3 leading-relaxed">
        Después de esto, nadie más podrá volver a esta pantalla. Para añadir o
        cambiar gente se edita directamente en Firebase.
      </p>
    </div>
  );
}
