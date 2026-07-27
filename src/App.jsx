import { useEffect, useState } from 'react';
import Availability from './components/Availability';
import MatchDay from './components/MatchDay';
import Payments from './components/Payments';
import Setup from './components/Setup';
import { configurado } from './config';
import { weekId, whoIsIn } from './lib/week';
import { elegirPagador } from './lib/payments';
import {
  watchAuth, login, logout, watchPlayers, watchWeek, watchSession,
  watchPayments, fijarDia, reabrirSemana, ensureWeek,
} from './lib/firebase';

const wid = weekId();

export default function App() {
  const [user, setUser] = useState(undefined);
  const [players, setPlayers] = useState({});
  const [week, setWeek] = useState({ availability: {}, status: 'abierta' });
  const [session, setSession] = useState(null);
  const [pagos, setPagos] = useState({ paidCount: {}, history: [] });
  const [tab, setTab] = useState('semana');
  const [cargado, setCargado] = useState(false);
  const [denegado, setDenegado] = useState(false);

  useEffect(() => watchAuth(setUser), []);
  useEffect(() => {
    if (!user) return;
    ensureWeek(wid);
    const u = [
      watchPlayers(
        p => { setPlayers(p); setCargado(true); setDenegado(false); },
        () => setDenegado(true),   // el correo no está en la lista de acceso
      ),
      watchWeek(wid, setWeek), watchSession(wid, setSession), watchPayments(setPagos),
    ];
    return () => u.forEach(f => f());
  }, [user]);

  if (!configurado) return <FaltaConfig />;
  if (user === undefined) return <Splash text="Entrando…" />;
  if (user === null) return <Login />;
  if (denegado) return <NoAutorizado email={user.email} />;
  if (!cargado) return <Splash text="Cargando…" />;
  if (!Object.keys(players).length) return <Setup user={user} />;

  const me = Object.values(players)
    .find(p => p.email && p.email.toLowerCase() === user.email.toLowerCase());
  if (!me) return <NoAutorizado email={user.email} />;

  const fijada = week.status === 'fijada';

  async function onFijar(best) {
    const confirmed = whoIsIn(week.availability, best.cid);
    const payerId = elegirPagador(confirmed, players, pagos.paidCount, pagos.order);
    await fijarDia(wid, best.cid, confirmed, payerId);
    setTab('partido');
  }

  return (
    <div className="min-h-dvh max-w-lg mx-auto px-4 pb-28 pt-6">
      <Header wid={wid} me={me} fijada={fijada} />

      <main className="mt-6">
        {tab === 'semana' && (fijada
          ? <YaFijada week={week} players={players} onReabrir={() => reabrirSemana(wid)} />
          : <Availability wid={wid} week={week} players={players} me={me} onFijar={onFijar} />)}
        {tab === 'partido' && (fijada
          ? <MatchDay wid={wid} week={week} session={session} players={players} />
          : <Vacio titulo="Todavía no hay noche fijada"
              texto="Cuando se fije el día aquí aparece el americano completo." />)}
        {tab === 'pagos' && <Payments wid={wid} week={week} players={players} pagos={pagos} />}
      </main>

      <Nav tab={tab} setTab={setTab} />
    </div>
  );
}

function Header({ wid, me, fijada }) {
  return (
    <header className="flex items-start justify-between">
      <div>
        <h1 className="t-display text-2xl">Cancha</h1>
        <p className="t-eyebrow mt-1">
          {wid} · {fijada ? 'noche fijada' : 'recogiendo horarios'}
        </p>
      </div>
      <button onClick={logout} className="chip text-line/60" title="Cerrar sesión">
        {me?.name ?? 'salir'}
      </button>
    </header>
  );
}

function Nav({ tab, setTab }) {
  const tabs = [['semana', 'Semana'], ['partido', 'Partido'], ['pagos', 'Pagos']];
  return (
    <nav className="fixed bottom-0 inset-x-0 pb-[env(safe-area-inset-bottom)]
      bg-night/92 backdrop-blur border-t border-glass/35">
      <div className="max-w-lg mx-auto grid grid-cols-3">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`py-4 t-eyebrow transition-colors ${
              tab === id ? 'text-flood' : 'text-line/45'}`}>
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
        <p className="text-sm text-line/55 mt-2">
          {(week.confirmed || []).length} jugadores confirmados. Ve a Partido para el americano.
        </p>
        <button className="btn btn-ghost w-full mt-4 text-sm" onClick={onReabrir}>
          Reabrir horarios
        </button>
        <p className="text-xs text-line/45 mt-2">
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
      <p className="text-sm text-line/55 mt-2">{texto}</p>
    </div>
  );
}

function FaltaConfig() {
  return (
    <div className="min-h-dvh grid place-items-center px-6">
      <div className="max-w-sm">
        <h1 className="t-display text-2xl">Falta conectar Firebase</h1>
        <p className="text-sm text-line/60 mt-3 leading-relaxed">
          Abre el archivo <span className="t-num text-flood">src/config.js</span> en
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

function Login() {
  return (
    <div className="min-h-dvh grid place-items-center px-6">
      <div className="text-center max-w-xs">
        <h1 className="t-display text-5xl leading-none">Cancha</h1>
        <p className="text-sm text-line/55 mt-4 leading-relaxed">
          Horarios, americano y turno de pago para los jueves de pádel.
        </p>
        <button className="btn btn-flood w-full mt-8" onClick={login}>
          Entrar con Google
        </button>
      </div>
    </div>
  );
}

function NoAutorizado({ email }) {
  return (
    <div className="min-h-dvh grid place-items-center px-6">
      <div className="text-center max-w-xs">
        <h1 className="t-display text-2xl">Esta cuenta no está en el grupo</h1>
        <p className="text-sm text-line/55 mt-3 t-num break-all">{email}</p>
        <p className="text-sm text-line/55 mt-3">
          Pide que añadan este correo a la lista de jugadores en Firestore.
        </p>
        <button className="btn btn-ghost w-full mt-6" onClick={logout}>Salir</button>
      </div>
    </div>
  );
}
