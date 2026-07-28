import { useEffect, useState } from 'react';
import Availability from './components/Availability';
import MatchDay from './components/MatchDay';
import Payments from './components/Payments';
import Cuentas from './components/Cuentas';
import Historial from './components/Historial';
import Setup from './components/Setup';
import { configurado } from './config';
import { weekId, whoIsIn, proximoReinicio } from './lib/week';
import { elegirPagador } from './lib/payments';
import {
  watchPlayers, watchWeek, watchSession, watchPayments,
  fijarDia, reabrirSemana, ensureWeek, leerYo, guardarYo, olvidarYo, unirse,
  watchLedger, guardarLedger, alFallar, watchSessions, watchWeeks,
} from './lib/firebase';
import { nuevoId } from './lib/ledger';

export default function App() {
  const [wid, setWid] = useState(() => weekId());
  const [yo, setYo] = useState(() => leerYo());
  const [players, setPlayers] = useState({});
  const [week, setWeek] = useState({ availability: {}, status: 'abierta' });
  const [session, setSession] = useState(null);
  const [pagos, setPagos] = useState({ paidCount: {}, history: [] });
  const [ledger, setLedger] = useState({ costoNoche: 20, movimientos: [] });
  const [sesiones, setSesiones] = useState([]);
  const [semanas, setSemanas] = useState({});
  const [tab, setTab] = useState('semana');
  const [cargado, setCargado] = useState(false);
  const [denegado, setDenegado] = useState(false);
  const [fallo, setFallo] = useState(null);

  // Cada minuto comprueba si ya pasó el reinicio del lunes 8 AM.
  // Si la app está abierta en ese momento, cambia de semana sola.
  useEffect(() => {
    const t = setInterval(() => setWid(w => (weekId() !== w ? weekId() : w)), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => alFallar(setFallo), []);

  useEffect(() => {
    ensureWeek(wid);
    const u = [
      watchPlayers(
        p => { setPlayers(p); setCargado(true); setDenegado(false); },
        () => setDenegado(true),   // reglas de Firestore mal publicadas
      ),
      watchWeek(wid, setWeek), watchSession(wid, setSession),
      watchPayments(setPagos), watchLedger(setLedger),
      watchSessions(setSesiones), watchWeeks(setSemanas),
    ];
    return () => u.forEach(f => f());
  }, [wid]);

  if (!configurado) return <FaltaConfig />;
  if (denegado) return <SinPermiso />;
  if (!cargado) return <Splash text="Cargando…" />;
  if (!Object.keys(players).length) return <Setup />;

  const me = players[yo];
  if (!me || me.active === false) {
    return <QuienEres players={players} onElegir={id => { guardarYo(id); setYo(id); }} />;
  }

  const fijada = week.status === 'fijada';

  async function onFijar(best) {
    const confirmed = whoIsIn(week.availability, best.cid);
    const payerId = elegirPagador(confirmed, players, pagos.paidCount, pagos.order);
    await fijarDia(wid, best.cid, confirmed, payerId);
    setTab('partido');
  }

  return (
    <div className="min-h-dvh max-w-lg mx-auto px-4 pb-28 pt-6">
      <Header wid={wid} me={me} fijada={fijada}
        onCambiar={() => { olvidarYo(); setYo(null); }} />

      {fallo && (
        <div className="mt-4 p-3 border-l-2 border-stamp bg-stamp/5">
          <p className="text-sm text-stamp leading-relaxed">{fallo}</p>
          <button className="t-eyebrow text-stamp/70 mt-2" onClick={() => setFallo(null)}>
            cerrar
          </button>
        </div>
      )}

      <main className="mt-6">
        {tab === 'semana' && (fijada
          ? <YaFijada week={week} players={players} onReabrir={() => reabrirSemana(wid)} />
          : <Availability wid={wid} week={week} players={players} me={me} onFijar={onFijar} />)}
        {tab === 'partido' && (
          <div className="space-y-8">
            {fijada
              ? <MatchDay wid={wid} week={week} session={session} players={players} />
              : <Vacio titulo="Todavía no hay partida fijada"
                  texto="Cuando se fije el día aquí aparece el americano completo." />}
            <Historial sesiones={sesiones} semanas={semanas} actual={wid} />
          </div>
        )}
        {tab === 'pagos' && (
          <>
            <Cuentas ledger={ledger} players={players} pagos={pagos} />
            <div className="court-rule my-6" />
            <Payments wid={wid} week={week} players={players} pagos={pagos} />
          </>
        )}
      </main>

      <Nav tab={tab} setTab={setTab} />
    </div>
  );
}

function Header({ wid, me, fijada, onCambiar }) {
  const r = proximoReinicio();
  const dias = Math.round((r - Date.now()) / 86400000);
  const cuando = dias <= 0
    ? `hoy a las ${r.getHours()}:00`
    : dias === 1 ? 'mañana' : `en ${dias} días`;

  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="t-display text-2xl">Cancha</h1>
        <p className="t-eyebrow mt-1">
          {wid} · {fijada ? 'partida fijada' : 'recogiendo horarios'}
        </p>
        <p className="t-eyebrow mt-0.5 text-ink/30">se reinicia {cuando}</p>
      </div>
      <button onClick={onCambiar} className="chip text-ink/60" title="No soy yo">
        {me?.name}
      </button>
    </header>
  );
}

function Nav({ tab, setTab }) {
  const tabs = [['semana', 'Semana'], ['partido', 'Partido'], ['pagos', 'Cuentas']];
  return (
    <nav className="fixed bottom-0 inset-x-0 pb-[env(safe-area-inset-bottom)]
      bg-card border-t border-rule">
      <div className="max-w-lg mx-auto grid grid-cols-3">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`py-4 t-eyebrow transition-colors ${
              tab === id ? 'text-stamp' : 'text-ink2'}`}>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function YaFijada({ week, players, onReabrir }) {
  return (
    <section className="space-y-4">
      <div className="panel p-5">
        <p className="t-eyebrow">Semana cerrada</p>
        <p className="t-display text-2xl mt-2">Ya hay día fijado</p>
        <p className="text-sm text-ink/55 mt-2">
          {(week.confirmed || []).length} jugadores confirmados. Ve a Partido para el americano.
        </p>
        <button className="btn btn-ghost w-full mt-4 text-sm" onClick={onReabrir}>
          Reabrir horarios
        </button>
        <p className="text-xs text-ink/45 mt-2">
          Reabrir borra el día fijado y el pagador asignado. El americano generado se mantiene.
        </p>
      </div>
    </section>
  );
}

function Vacio({ titulo, texto }) {
  return (
    <div className="panel p-6 text-center">
      <p className="t-display text-lg">{titulo}</p>
      <p className="text-sm text-ink/55 mt-2">{texto}</p>
    </div>
  );
}

function FaltaConfig() {
  return (
    <div className="min-h-dvh grid place-items-center px-6">
      <div className="max-w-sm">
        <h1 className="t-display text-2xl">Falta conectar Firebase</h1>
        <p className="text-sm text-ink/60 mt-3 leading-relaxed">
          Abre el archivo <span className="t-num text-stamp">src/config.js</span> en
          tu repositorio de GitHub y pega ahí los datos de tu proyecto de Firebase.
          Es el paso 5 del README.
        </p>
      </div>
    </div>
  );
}

function Splash({ text }) {
  return (
    <div className="min-h-dvh grid place-items-center">
      <p className="t-eyebrow">{text}</p>
    </div>
  );
}

function QuienEres({ players, onElegir }) {
  const [nombre, setNombre] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(null);

  const conocidos = Object.values(players)
    .filter(p => p.active !== false)
    .sort((a, b) => Number(a.isGuest) - Number(b.isGuest) || a.name.localeCompare(b.name));

  async function entrar(texto) {
    const n = (texto ?? nombre).trim();
    if (!n) return;
    setOcupado(true); setError(null);
    try {
      onElegir(await unirse(n, players));
    } catch (e) {
      setError(e.message || 'No se pudo guardar');
      setOcupado(false);
    }
  }

  return (
    <div className="min-h-dvh max-w-lg mx-auto px-6 py-12">
      <h1 className="t-display text-4xl leading-none">Cancha</h1>
      <p className="t-eyebrow mt-5">¿Cómo te llamas?</p>
      <p className="text-sm text-ink/55 mt-2 leading-relaxed">
        Escribe tu nombre y ya estás dentro. Se queda guardado en este teléfono.
      </p>

      <div className="flex gap-2 mt-5">
        <input
          className="flex-1 bg-paper/60 border border-rule/50 rounded-lg px-3 py-3"
          value={nombre} onChange={e => setNombre(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && entrar()}
          placeholder="Tu nombre" autoFocus maxLength={20}
        />
        <button className="btn btn-stamp px-5" disabled={!nombre.trim() || ocupado}
          onClick={() => entrar()}>
          Entrar
        </button>
      </div>
      {error && <p className="text-xs text-stamp mt-2">{error}</p>}

      {conocidos.length > 0 && (
        <>
          <p className="t-eyebrow mt-8">O toca tu nombre si ya estás</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {conocidos.map(p => (
              <button key={p.id} onClick={() => entrar(p.name)} disabled={ocupado}
                className="btn btn-ghost py-3 text-sm">{p.name}</button>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-ink/40 mt-8 leading-relaxed">
        Si escribes un nombre que ya existe, entras como esa persona. Los nombres
        nuevos se añaden como invitados y no entran en la rotación de pago.
      </p>
    </div>
  );
}

function SinPermiso() {
  return (
    <div className="min-h-dvh grid place-items-center px-6">
      <div className="max-w-sm">
        <h1 className="t-display text-2xl">Firestore está bloqueado</h1>
        <p className="text-sm text-ink/60 mt-3 leading-relaxed">
          Las reglas de seguridad no se publicaron. Vuelve al Paso 4 del README:
          Firestore Database → pestaña Reglas → pega el contenido de
          <span className="t-num text-stamp"> firestore.rules</span> → Publicar.
        </p>
      </div>
    </div>
  );
}
