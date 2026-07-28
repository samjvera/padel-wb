import { useState } from 'react';
import CourtDiagram from './CourtDiagram';
import Leaderboard from './Leaderboard';
import { generateAmericano, rondasSugeridas } from '../lib/americano';
import { guardarSesion, guardarResultado, addGuest } from '../lib/firebase';
import { DIAS, SLOTS, fechaDe } from '../lib/week';
import { icsPartido, descargar } from '../lib/ics';
import CopiarGrupo from './CopiarGrupo';
import { textoNocheFijada } from '../lib/share';

const PUNTOS = [16, 20, 24, 32];

export default function MatchDay({ wid, week, session, players }) {
  const [gen, setGen] = useState(false);
  const [puntos, setPuntos] = useState(16);
  const [rondas, setRondas] = useState(null);

  const confirmed = week.confirmed || [];
  const [dia, slot] = (week.cellId || ':').split(':');
  const diaLabel = DIAS.find(d => d.id === dia)?.label ?? '—';
  const slotLabel = SLOTS.find(s => s.id === slot)?.label ?? '—';
  const nombres = confirmed.map(id => players[id]?.name ?? id);
  const rondasFinal = rondas ?? rondasSugeridas(confirmed.length);

  async function generar() {
    if (confirmed.length < 4) return;
    setGen(true);
    try {
      const out = generateAmericano(nombres, rondasFinal, Date.now() % 100000);
      await guardarSesion(wid, {
        pointsPerMatch: puntos,
        rounds: out.rounds,
        results: {},
        quality: out.quality,
      });
    } finally { setGen(false); }
  }

  const rounds = session?.rounds || [];

  return (
    <section className="space-y-5">
      <header>
        <p className="t-section">Partida fijada</p>
        <h2 className="t-display text-3xl mt-1">{diaLabel}</h2>
        <p className="t-num text-ac mt-1">{slotLabel}</p>
        <button
          className="btn btn-ghost w-full mt-4 text-sm"
          onClick={() => descargar(icsPartido({
            fecha: fechaDe(wid, dia), slot,
            jugadores: nombres,
            pagador: players[week.payerId]?.name,
            url: window.location.href,
          }), 'padel.ics')}
        >
          Añadir al calendario
        </button>
        <div className="mt-2">
          <CopiarGrupo texto={textoNocheFijada(week, players, window.location.href)} />
        </div>
      </header>

      <Roster confirmed={confirmed} players={players} />

      <div className="court-rule" />

      {rounds.length === 0 ? (
        <Setup
          n={confirmed.length} puntos={puntos} setPuntos={setPuntos}
          rondas={rondasFinal} setRondas={setRondas} generar={generar} gen={gen}
        />
      ) : (
        <>
          <Leaderboard session={session} players={players} />
          <div className="court-rule" />
          <div className="space-y-4">
            <p className="t-eyebrow">Rondas — {rounds.length} en total</p>
            {rounds.map((r, i) => (
              <Round key={i} wid={wid} idx={i} round={r}
                result={session.results?.[i]} puntos={session.pointsPerMatch} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Roster({ confirmed, players }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('M');

  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between">
        <p className="t-eyebrow">En la cancha</p>
        <span className="t-num text-ac text-lg">{confirmed.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {confirmed.map(id => (
          <span key={id} className="chip">
            {players[id]?.name ?? id}
            {players[id]?.isGuest && <span className="text-ac ml-1">inv</span>}
          </span>
        ))}
      </div>

      {open ? (
        <div className="mt-4 space-y-2">
          <input
            className="w-full bg-s1 border border-br/25 rounded-sm px-3 py-2 text-sm"
            placeholder="Nombre del invitado" value={name}
            onChange={e => setName(e.target.value)} autoFocus
          />
          <div className="flex gap-2">
            {['M', 'F'].map(g => (
              <button key={g} onClick={() => setGender(g)}
                className={`chip flex-1 py-2 ${gender === g ? 'bg-ac text-bg border-ac' : ''}`}>
                {g === 'M' ? 'Hombre' : 'Mujer'}
              </button>
            ))}
          </div>
          <p className="text-xs text-tx/45">
            Los invitados no entran en la rotación de pago.
          </p>
          <div className="flex gap-2">
            <button className="btn btn-ghost flex-1 text-sm" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button
              className="btn btn-ac flex-1 text-sm"
              disabled={!name.trim()}
              onClick={async () => { await addGuest(name, gender); setName(''); setOpen(false); }}
            >
              Añadir
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-ghost w-full mt-4 text-sm" onClick={() => setOpen(true)}>
          Añadir invitado
        </button>
      )}
    </div>
  );
}

function Setup({ n, puntos, setPuntos, rondas, setRondas, generar, gen }) {
  const minutos = Math.round(rondas * (puntos / 16) * 9.5);
  const largo = minutos > 90;

  return (
    <div className="panel p-4 space-y-4">
      <div>
        <p className="t-eyebrow">Puntos por partido</p>
        <div className="flex gap-2 mt-2">
          {PUNTOS.map(p => (
            <button key={p} onClick={() => setPuntos(p)}
              className={`chip flex-1 py-2 t-num ${p === puntos ? 'bg-ac text-bg border-ac' : ''}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <p className="t-eyebrow">Rondas</p>
          <span className="t-num text-ac">{rondas}</span>
        </div>
        <input type="range" min="3" max="16" value={rondas} className="w-full mt-2 accent-ac"
          onChange={e => setRondas(Number(e.target.value))} />
        <p className={`text-xs mt-1 ${largo ? 'text-ac' : 'text-tx/45'}`}>
          ≈ {minutos} min de juego · {largo ? 'se pasa del bloque de 90 min' : 'cabe en el bloque'}
        </p>
      </div>

      {n > 6 && (
        <p className="text-xs text-ac/90 leading-relaxed">
          Con {n} jugadores en una cancha, cada uno se sienta {' '}
          {Math.round((1 - 4 / n) * 100)}% de las rondas. Los puntos M+ compensan el marcador,
          no el tiempo en la banca.
        </p>
      )}

      <button className="btn btn-ac w-full" onClick={generar} disabled={n < 4 || gen}>
        {gen ? 'Armando…' : n < 4 ? 'Faltan jugadores' : 'Armar americano'}
      </button>
    </div>
  );
}

function Round({ wid, idx, round, result, puntos }) {
  const [a, setA] = useState(result?.[0] ?? '');
  const done = Array.isArray(result);
  const na = Number(a);
  const valido = a !== '' && na >= 0 && na <= puntos;

  const guardar = () => valido && guardarResultado(wid, idx, [na, puntos - na]);

  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between mb-1">
        <span className="t-eyebrow">Ronda {round.round}</span>
        {done
          ? <span className="badge badge-ac">jugada</span>
          : <span className="badge badge-off">pendiente</span>}
      </div>

      <CourtDiagram
        teamA={round.teamA} teamB={round.teamB}
        scoreA={done ? result[0] : null} scoreB={done ? result[1] : null}
      />

      {round.resting?.length > 0 && (
        <p className="text-xs text-tx/45 mt-2">
          Descansan: {round.resting.join(', ')}
        </p>
      )}

      <div className="flex items-center gap-2 mt-3">
        <input
          type="number" inputMode="numeric" min="0" max={puntos} value={a}
          onChange={e => setA(e.target.value)}
          placeholder={`0–${puntos}`}
          className="t-num w-24 bg-s1 border border-br/25 rounded-sm px-3 py-2 text-center"
          aria-label={`Puntos de ${round.teamA.join(' y ')}`}
        />
        <span className="t-num text-tx/45 text-sm">
          → {valido ? puntos - na : '—'} para {round.teamB.join(' y ')}
        </span>
        <button className="btn btn-ghost ml-auto text-sm py-2" onClick={guardar} disabled={!valido}>
          {done ? 'Corregir' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
