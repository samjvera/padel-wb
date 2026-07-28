import { useState } from 'react';
import { deudas, repartir, nuevoId } from '../lib/ledger';
import { colaDePago } from '../lib/payments';
import { guardarLedger } from '../lib/firebase';

const dinero = n => `$${Math.abs(n).toFixed(2).replace(/\.00$/, '')}`;
const hoy = () => new Date().toISOString().slice(0, 10);
const aFecha = s => new Date(s + 'T12:00:00').getTime();
const corta = t => new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short' });

export default function Cuentas({ ledger, players, pagos }) {
  const [abrir, setAbrir] = useState(null);   // 'dinero' | 'partida' | null
  const [ajustes, setAjustes] = useState(false);

  const mov = ledger?.movimientos || [];
  const costo = ledger?.costoNoche ?? 20;
  const n = id => players[id]?.name ?? id;
  const d = deudas(mov);
  const { cargos } = repartir(mov);
  const pagosLista = mov.filter(m => m.tipo === 'pago').sort((a, b) => (b.fecha || 0) - (a.fecha || 0));

  const guardar = (nuevos, precio = costo) =>
    guardarLedger({ costoNoche: precio, movimientos: nuevos });
  const anadir = m => guardar([{ ...m, id: nuevoId() }, ...mov]);
  const borrar = id => guardar(mov.filter(m => m.id !== id));

  return (
    <section className="space-y-6">
      <header>
        <p className="t-eyebrow">Cuentas</p>
        <h2 className="t-display text-3xl mt-1">Quién le debe a quién</h2>
      </header>

      {/* Deudas */}
      <div className="panel p-4">
        {d.lista.length === 0 ? (
          <p className="t-display text-xl">Nadie debe nada</p>
        ) : (
          <ul>
            {d.lista.map((x, i) => (
              <li key={i} className="flex items-center gap-3 py-3 border-b border-glass/25 last:border-0">
                <div className="flex-1 min-w-0">
                  {x.cancha ? (
                    <>
                      <p className="text-sm"><b>{n(x.de)}</b>
                        <span className="text-line/40"> → </span>
                        <span className="text-flood">la cancha</span></p>
                      <p className="t-eyebrow mt-0.5 text-flood/70">su partida sigue sin pagarse</p>
                    </>
                  ) : (
                    <p className="text-sm">
                      <b>{n(x.de)}</b><span className="text-line/40"> → </span><b>{n(x.a)}</b>
                    </p>
                  )}
                </div>
                <span className="t-num text-flood font-semibold">{dinero(x.monto)}</span>
                <button className="chip px-3 py-1.5 whitespace-nowrap"
                  onClick={() => anadir(x.cancha
                    ? { tipo: 'pago', quien: x.de, monto: x.monto, fecha: Date.now() }
                    : { tipo: 'traspaso', quien: x.de, para: x.a, monto: x.monto, fecha: Date.now() })}>
                  {x.cancha ? 'ya llevó' : 'ya pagó'}
                </button>
              </li>
            ))}
          </ul>
        )}
        {d.sobrante > 0.005 && (
          <p className="text-xs text-line/50 mt-3">
            Hay {dinero(d.sobrante)} adelantados
            {costo > 0 && ` — cubren ${(d.sobrante / costo).toFixed(1)} partidas`}.
          </p>
        )}
      </div>

      {/* Partidas — siempre visibles, para que al añadir una la veas aparecer */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="t-eyebrow">Partidas</p>
          <span className="t-num text-xs text-line/35">{cargos.length}</span>
        </div>
        <div className="panel p-4">
          {cargos.length === 0 ? (
            <p className="text-sm text-line/50">
              Ninguna todavía. Se añaden solas al fijar el día en la pestaña Semana.
            </p>
          ) : (
            <ul>
              {cargos.map(c => (
                <li key={c.id} className="flex items-start gap-3 py-2.5 border-b border-glass/25 last:border-0">
                  <span className="t-num text-xs text-line/35 w-14 pt-0.5">
                    {c.fecha ? corta(c.fecha) : '—'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{n(c.quien)} · {dinero(c.monto)}</p>
                    <p className="t-num text-xs text-line/40 truncate">
                      {c.restante > 0.005
                        ? `sin pagar${c.cubiertoPor.length ? ` · faltan ${dinero(c.restante)}` : ''}`
                        : `pagó ${c.cubiertoPor.map(p => n(p.quien)).join(' y ')}`}
                    </p>
                  </div>
                  <button className="chip px-2 text-xs text-line/35"
                    onClick={() => borrar(c.id)}>×</button>
                </li>
              ))}
            </ul>
          )}

          {abrir === 'partida' ? (
            <NuevaPartida players={players} pagos={pagos} costo={costo}
              onCerrar={() => setAbrir(null)}
              onGuardar={m => { anadir(m); setAbrir(null); }} />
          ) : (
            <button className="btn btn-ghost w-full mt-3 text-sm"
              onClick={() => setAbrir('partida')}>
              Añadir partida anterior
            </button>
          )}
        </div>
      </div>

      {/* Dinero */}
      <div>
        <p className="t-eyebrow mb-2">Dinero llevado</p>
        <div className="panel p-4">
          {pagosLista.length === 0 ? (
            <p className="text-sm text-line/50">Nadie ha llevado dinero todavía.</p>
          ) : (
            <ul>
              {pagosLista.map(m => (
                <li key={m.id} className="flex items-center gap-3 py-2.5 border-b border-glass/25 last:border-0">
                  <span className="t-num text-xs text-line/35 w-14">{corta(m.fecha)}</span>
                  <p className="flex-1 text-sm">{n(m.quien)}</p>
                  <span className="t-num text-sm text-flood">{dinero(m.monto)}</span>
                  <button className="chip px-2 text-xs text-line/35"
                    onClick={() => borrar(m.id)}>×</button>
                </li>
              ))}
            </ul>
          )}

          {abrir === 'dinero' ? (
            <LlevoDinero players={players}
              onCerrar={() => setAbrir(null)}
              onGuardar={m => { anadir(m); setAbrir(null); }} />
          ) : (
            <button className="btn btn-flood w-full mt-3" onClick={() => setAbrir('dinero')}>
              Alguien llevó dinero
            </button>
          )}
        </div>
      </div>

      <button className="w-full t-eyebrow text-line/35 py-2" onClick={() => setAjustes(!ajustes)}>
        {ajustes ? '− ajustes' : '+ ajustes'}
      </button>
      {ajustes && <Precio costo={costo} onGuardar={p => guardar(mov, p)} />}
    </section>
  );
}

function Gente({ players, valor, onCambiar }) {
  const lista = Object.values(players).filter(p => p.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="flex flex-wrap gap-1.5">
      {lista.map(g => (
        <button key={g.id} onClick={() => onCambiar(g.id)}
          className={`chip py-2 ${valor === g.id ? 'bg-flood text-night border-flood' : ''}`}>
          {g.name}
        </button>
      ))}
    </div>
  );
}

function LlevoDinero({ players, onCerrar, onGuardar }) {
  const [quien, setQuien] = useState(null);
  const [monto, setMonto] = useState(null);
  const [otra, setOtra] = useState(false);
  const [fecha, setFecha] = useState(hoy());

  return (
    <div className="mt-4 pt-4 border-t border-glass/40 space-y-4">
      <h3 className="t-display text-base text-flood">¿Quién llevó dinero?</h3>
      <Gente players={players} valor={quien} onCambiar={setQuien} />

      {quien && (
        <>
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
          onClick={() => onGuardar({ tipo: 'pago', quien, monto: Number(monto), fecha: aFecha(fecha) })}>
          Guardar
        </button>
      </div>
    </div>
  );
}

function NuevaPartida({ players, pagos, costo, onCerrar, onGuardar }) {
  const sugerido = colaDePago(players, pagos?.paidCount || {}, pagos?.order)[0]?.id;
  const [quien, setQuien] = useState(sugerido ?? null);
  const [fecha, setFecha] = useState(hoy());
  const [monto, setMonto] = useState(String(costo));

  return (
    <div className="mt-4 pt-4 border-t border-glass/40 space-y-4">
      <h3 className="t-display text-base text-flood">¿A quién le tocaba pagar?</h3>
      <Gente players={players} valor={quien} onCambiar={setQuien} />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="t-eyebrow mb-1">Cuándo</p>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="t-num w-full bg-night/60 border border-glass/50 rounded-lg px-3 py-2" />
        </div>
        <div>
          <p className="t-eyebrow mb-1">Costó</p>
          <input type="number" inputMode="decimal" value={monto}
            onChange={e => setMonto(e.target.value)}
            className="t-num w-full bg-night/60 border border-glass/50 rounded-lg px-3 py-2" />
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-ghost flex-1 text-sm" onClick={onCerrar}>Cancelar</button>
        <button className="btn btn-flood flex-1 text-sm" disabled={!quien || !(Number(monto) > 0)}
          onClick={() => onGuardar({ tipo: 'cargo', quien, monto: Number(monto),
            fecha: aFecha(fecha), semana: fecha })}>
          Añadir
        </button>
      </div>
    </div>
  );
}

function Precio({ costo, onGuardar }) {
  const [v, setV] = useState(String(costo));
  return (
    <div className="panel p-4">
      <p className="t-eyebrow">Precio de una partida</p>
      <div className="flex gap-2 mt-2">
        <input type="number" inputMode="decimal" value={v} onChange={e => setV(e.target.value)}
          className="t-num flex-1 bg-night/60 border border-glass/50 rounded-lg px-3 py-2" />
        <button className="btn btn-ghost text-sm" onClick={() => onGuardar(Number(v) || 0)}>
          Guardar
        </button>
      </div>
    </div>
  );
}
