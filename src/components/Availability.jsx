import { DIAS, SLOTS, cellId, rankSlots, whoIsIn } from '../lib/week';
import { setAvailability } from '../lib/firebase';
import CopiarGrupo from './CopiarGrupo';
import { textoSemanaAbierta } from '../lib/share';

export default function Availability({ wid, week, players, me, onFijar }) {
  const av = week.availability || {};
  const ranked = rankSlots(av);
  const best = ranked[0]?.count > 0 ? ranked[0] : null;
  const mine = av[me?.id] || {};

  const toggle = cid => setAvailability(wid, me.id, cid, !mine[cid]);

  return (
    <section className="space-y-5">
      <header>
        <p className="t-eyebrow">Paso 1 — disponibilidad</p>
        <h2 className="t-display text-3xl mt-1">¿Cuándo puedes?</h2>
        <p className="text-sm text-line/55 mt-2">
          Marca todos los horarios que te sirven. Mientras más marques, más fácil cuadrar.
        </p>
      </header>

      <div className="panel p-3">
        <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-1.5">
          <div />
          {DIAS.map(d => (
            <div key={d.id} className="text-center t-eyebrow pb-1">{d.short}</div>
          ))}

          {SLOTS.map(s => (
            <Row key={s.id} slot={s} av={av} mine={mine} best={best}
              players={players} toggle={toggle} />
          ))}
        </div>
      </div>

      <div className="panel p-4">
        <p className="t-eyebrow">Avisar al grupo</p>
        <p className="text-sm text-line/55 mt-2 leading-relaxed">
          La app no manda avisos. Copia el estado de la semana y pégalo donde ya
          hablan ustedes.
        </p>
        <div className="mt-3">
          <CopiarGrupo texto={textoSemanaAbierta(week, players, window.location.href)} />
        </div>
      </div>

      <div className="court-rule" />

      {best ? (
        <div className="panel p-4">
          <p className="t-eyebrow">Mejor opción ahora mismo</p>
          <p className="t-display text-2xl mt-1.5">
            {best.dia.label} · {best.slot.short}
          </p>
          <p className="t-num text-flood text-sm mt-1">
            {best.count} confirmado{best.count === 1 ? '' : 's'}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {whoIsIn(av, best.cid).map(pid => (
              <span key={pid} className="chip">{players[pid]?.name ?? pid}</span>
            ))}
          </div>
          <button className="btn btn-flood w-full mt-4" onClick={() => onFijar(best)}>
            Fijar este día
          </button>
          <p className="text-xs text-line/45 mt-2">
            Al fijarlo se arma el americano y se asigna quién paga la cancha.
          </p>
        </div>
      ) : (
        <div className="panel p-5 text-center">
          <p className="t-display text-lg">Nadie ha marcado todavía</p>
          <p className="text-sm text-line/55 mt-1.5">Sé el primero: toca una casilla arriba.</p>
        </div>
      )}
    </section>
  );
}

function Row({ slot, av, mine, best, players, toggle }) {
  return (
    <>
      <div className="t-eyebrow flex items-center pr-2 whitespace-nowrap">{slot.short}</div>
      {DIAS.map(d => {
        const cid = cellId(d.id, slot.id);
        const n = whoIsIn(av, cid).length;
        const on = !!mine[cid];
        return (
          <button
            key={cid}
            onClick={() => toggle(cid)}
            data-on={on}
            data-best={best?.cid === cid}
            className="cell flex flex-col items-center justify-center"
            aria-pressed={on}
            aria-label={`${d.label} ${slot.label}, ${n} disponibles`}
          >
            <span className={`t-num text-sm font-semibold ${on ? '' : n ? 'text-flood' : 'text-line/30'}`}>
              {n || '·'}
            </span>
          </button>
        );
      })}
    </>
  );
}
