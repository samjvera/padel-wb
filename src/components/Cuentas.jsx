import { useState } from 'react';
import { deudas, repartir, nuevoId } from '../lib/ledger';
import { colaDePago } from '../lib/payments';
import { guardarLedger } from '../lib/firebase';

const dinero = n => `$${Math.abs(n).toFixed(2).replace(/\.00$/, '')}`;
const hoy = () => new Date().toISOString().slice(0, 10);
const aFecha = s => new Date(s + 'T12:00:00').getTime();
const deFecha = t => new Date(t).toLocaleDateString();

export default function Cuentas({ ledger, players, pagos }) {
  const [poner, setPoner] = useState(false);
  const [mas, setMas] = useState(false);

  const mov = ledger?.movimientos || [];
  const costo = ledger?.costoNoche ?? 20;
  const n = id => players[id]?.name ?? id;
  const d = deudas(mov);

  const guardar = nuevos => guardarLedger({ costoNoche: costo, movimientos: nuevos });
  const anadir = m => guardar([{ ...m, id: nuevoId() }, ...mov]);

  return (
    <section className="space-y-5">
      <header>
        <p className="t-eyebrow">Cuentas</p>
        <h2 className="t-display text-3xl mt-1">Quién le debe a quién</h2>
      </header>

      <div className="panel p-4">
        {d.lista.length === 0 ? (
          <p className="t-display text-xl">Nadie debe nada</p>
        ) : (
          <ul>
            {d.lista.map((x, i) => (
              <li key={i} className="flex items-center gap-3 py-3 border-b border-glass/25 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <b>{n(x.de)}</b>
                    <span className="text-line/40"> → </span>
                    <b>{n(x.a)}</b>
                  </p>
                </div>
                <span className="t-num text-flood font-semibold">{dinero(x.monto)}</span>
                <button className="chip px-3 py-1.5"
                  title={`${n(x.de)} ya le pagó a ${n(x.a)}`}
                  onClick={() => anadir({ tipo: 'traspaso', quien: x.de, para: x.a,
                    monto: x.monto, fecha: Date.now() })}>
                  ya pagó
                </button>
              </li>
            ))}
          </ul>
        )}

        {d.sinPagar > 0.005 && (
          <p className="text-xs text-flood mt-3">
            Faltan {dinero(d.sinPagar)} de cancha por poner.
          </p>
        )}
        {d.sobrante > 0.005 && (
          <p className="text-xs text-line/50 mt-3">
            Hay {dinero(d.sobrante)} adelantados
            {costo > 0 && ` — cubren ${(d.sobrante / costo).toFixed(1)} noches`}.
          </p>
        )}
      </div>

      {poner ? (
        <PusoDinero players={players} onCerrar={() => setPoner(false)}
          onGuardar={m => { anadir(m); setPoner(false); }} />
      ) : (
        <button className="btn btn-flood w-full" onClick={() => setPoner(true)}>
          Alguien llevó dinero
        </button>
      )}

      <button className="w-full t-eyebrow text-line/35 py-2" onClick={() => setMas(!mas)}>
        {mas ? '− ocultar detalles' : '+ detalles y correcciones'}
      </button>

      {mas && <Avanzado ledger={ledger} players={players} pagos={pagos}
        n={n} mov={mov} costo={costo} guardar={guardar} anadir={anadir} />}
    </section>
  );
}

/** La única acción que se usa cada semana. */
function PusoDinero({ players, onCerrar, onGuardar }) {
  const gente = Object.values(players).filter(p => p.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
  const [quien, setQuien] = useState(null);
  const [monto, setMonto] = useState(null);
  const [otra, setOtra] = useState(false);
  const [fecha, setFecha] = useState(hoy());

  return (
    <div className="panel p-4 space-y-4">
      <h3 className="t-display text-lg text-flood">¿Quién llevó dinero?</h3>

      <div className="flex flex-wrap gap-1.5">
        {gente.map(g => (
          <button key={g.id} onClick={() => setQuien(g.id)}
            className={`chip py-2 ${quien === g.id ? 'bg-flood text-night border-flood' : ''}`}>
            {g.name}
          </button>
        ))}
      </div>

      {quien && (
        <>
          <div>
            <p className="t-eyebrow mb-2">¿Cuánto?</p>
            <div className="flex gap-2">
              {[20, 50, 100].map(v => (
                <button key={v} onClick={() => setMonto(v)}
                  className={`chip flex-1 py-2.5 t-num ${monto === v ? 'bg-flood text-night border-flood' : ''}`}>
                  ${v}
                </button>
              ))}
              <input type="number" inputMode="decimal" min="0" placeholder="otro"
                value={[20, 50, 100].includes(monto) ? '' : (monto ?? '')}
                onChange={e => setMonto(Number(e.target.value) || null)}
                className="t-num w-20 bg-night/60 border border-glass/50 rounded-full px-3 text-center text-sm" />
            </div>
          </div>

          {otra ? (
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="t-num w-full bg-night/60 border border-glass/50 rounded-lg px-3 py-2" />
          ) : (
            <button className="t-eyebrow text-line/40" onClick={() => setOtra(true)}>
              hoy · cambiar fecha
            </button>
          )}
        </>
      )}

      <div className="flex gap-2">
        <button className="btn btn-ghost flex-1 text-sm" onClick={onCerrar}>Cancelar</button>
        <button className="btn btn-flood flex-1 text-sm" disabled={!quien || !monto}
          onClick={() => onGuardar({ tipo: 'pago', quien, monto: Number(monto),
            fecha: aFecha(fecha) })}>
          Guardar
        </button>
      </div>
    </div>
  );
}

/** Todo lo raro vive aquí: corregir, backfill, precio, desglose. */
function Avanzado({ players, pagos, n, mov, costo, guardar, anadir }) {
  const [noche, setNoche] = useState(false);
  const [precio, setPrecio] = useState(String(costo));
  const gente = Object.values(players).filter(p => p.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
  const sugerido = colaDePago(players, pagos?.paidCount || {}, pagos?.order)[0]?.id;
  const [quien, setQuien] = useState(sugerido ?? gente[0]?.id);
  const [fecha, setFecha] = useState(hoy());
  const { cargos } = repartir(mov);

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <p className="t-eyebrow">Precio de una noche</p>
        <div className="flex gap-2 mt-2">
          <input type="number" inputMode="decimal" value={precio}
            onChange={e => setPrecio(e.target.value)}
            className="t-num flex-1 bg-night/60 border border-glass/50 rounded-lg px-3 py-2" />
          <button className="btn btn-ghost text-sm"
            onClick={() => guardarLedger({ costoNoche: Number(precio) || 0, movimientos: mov })}>
            Guardar
          </button>
        </div>
      </div>

      <div className="panel p-4">
        <p className="t-eyebrow">Añadir una noche a mano</p>
        <p className="text-xs text-line/45 mt-1.5">
          Normalmente se crea sola al fijar el día. Úsalo solo para cargar noches viejas.
        </p>
        {noche ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {gente.map(g => (
                <button key={g.id} onClick={() => setQuien(g.id)}
                  className={`chip ${quien === g.id ? 'bg-flood text-night border-flood' : ''}`}>
                  {g.name}
                </button>
              ))}
            </div>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="t-num w-full bg-night/60 border border-glass/50 rounded-lg px-3 py-2" />
            <div className="flex gap-2">
              <button className="btn btn-ghost flex-1 text-sm" onClick={() => setNoche(false)}>
                Cancelar
              </button>
              <button className="btn btn-flood flex-1 text-sm"
                onClick={() => { anadir({ tipo: 'cargo', quien, monto: costo,
                  fecha: aFecha(fecha), semana: fecha }); setNoche(false); }}>
                Añadir por {dinero(costo)}
              </button>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost w-full mt-3 text-sm" onClick={() => setNoche(true)}>
            Añadir noche
          </button>
        )}
      </div>

      {cargos.length > 0 && (
        <div className="panel p-4">
          <p className="t-eyebrow">Qué billete pagó qué noche</p>
          <ul className="mt-2">
            {cargos.map((c, i) => (
              <li key={i} className="py-2 border-t border-glass/25">
                <p className="text-sm">Noche de <b>{n(c.quien)}</b></p>
                <p className="t-num text-xs text-line/45 mt-0.5">
                  {c.cubiertoPor.length
                    ? c.cubiertoPor.map(p => `${dinero(p.monto)} de ${n(p.quien)}`).join('  +  ')
                    : 'sin pagar'}
                  {c.restante > 0.005 && `  ·  faltan ${dinero(c.restante)}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mov.length > 0 && (
        <div className="panel p-4">
          <p className="t-eyebrow">Movimientos · toca × para borrar</p>
          <ul className="mt-2">
            {[...mov].sort((a, b) => (b.fecha || 0) - (a.fecha || 0)).map(m => (
              <li key={m.id} className="flex items-center gap-2 py-2 border-t border-glass/25">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {m.tipo === 'cargo' ? `Noche de ${n(m.quien)}`
                      : m.tipo === 'pago' ? `${n(m.quien)} llevó dinero`
                      : `${n(m.quien)} le pagó a ${n(m.para)}`}
                  </p>
                  <p className="t-num text-xs text-line/40">{m.fecha ? deFecha(m.fecha) : ''}</p>
                </div>
                <span className={`t-num text-sm ${m.tipo === 'cargo' ? 'text-line/50' : 'text-flood'}`}>
                  {m.tipo === 'cargo' ? '−' : '+'}{dinero(m.monto)}
                </span>
                <button className="chip px-2 text-xs text-line/40"
                  onClick={() => guardar(mov.filter(x => x.id !== m.id))}>×</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
