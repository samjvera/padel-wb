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
        <p className="t-section">Cuentas</p>
        <h2 className="t-display text-3xl mt-1">Quién le debe a quién</h2>
      </header>

      {/* Deudas */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-br">
          <span className="t-eyebrow">Quién le debe a quién</span>
          {d.lista.length > 0 && (
            <span className="t-num text-micro text-t3">{d.lista.length}</span>
          )}
        </div>
        {d.lista.length === 0 ? (
          <p className="px-3.5 py-6 text-center text-tiny text-t3">Nadie debe nada</p>
        ) : (
          <ul>
            {d.lista.map((x, i) => (
              <li key={i} className="flex items-center gap-3 py-3 border-b border-br/25 last:border-0">
                <div className="flex-1 min-w-0">
                  {x.cancha ? (
                    <>
                      <p className="text-base"><b>{n(x.de)}</b>
                        <span className="text-t3"> → </span>
                        <span className="text-wn">la cancha</span></p>
                      <p className="text-micro text-t3 mt-0.5">partida sin pagar</p>
                    </>
                  ) : (
                    <p className="text-base">
                      <b>{n(x.de)}</b><span className="text-t3"> → </span><b>{n(x.a)}</b>
                    </p>
                  )}
                </div>
                <span className={`t-num font-semibold ${x.cancha ? 'text-wn' : 'text-ac'}`}>
                  {dinero(x.monto)}
                </span>
                <button className="chip px-2.5 py-1 text-tiny whitespace-nowrap"
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
          <p className="text-xs text-tx/50 mt-3">
            Hay {dinero(d.sobrante)} adelantados
            {costo > 0 && ` — cubren ${(d.sobrante / costo).toFixed(1)} partidas`}.
          </p>
        )}
      </div>

      {/* Partidas — siempre visibles, para que al añadir una la veas aparecer */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="t-eyebrow">Partidas</p>
          <span className="t-num text-xs text-tx/35">{cargos.length}</span>
        </div>
        <div className="panel overflow-hidden py-0">
          {cargos.length === 0 ? (
            <p className="text-sm text-tx/50">
              Ninguna todavía. Se añaden solas al fijar el día en la pestaña Semana.
            </p>
          ) : (
            <ul>
              {cargos.map(c => (
                <li key={c.id} className="flex items-start gap-3 py-2.5 border-b border-br/25 last:border-0">
                  <span className="t-num text-xs text-tx/35 w-14 pt-0.5">
                    {c.fecha ? corta(c.fecha) : '—'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{n(c.quien)} · {dinero(c.monto)}</p>
                    <p className="t-num text-xs text-tx/40 truncate">
                      {c.restante > 0.005
                        ? `sin pagar${c.cubiertoPor.length ? ` · faltan ${dinero(c.restante)}` : ''}`
                        : `pagó ${c.cubiertoPor.map(p => n(p.quien)).join(' y ')}`}
                    </p>
                  </div>
                  <button className="chip px-2 text-xs text-tx/35"
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
            <button className="btn btn-ghost w-full text-tiny rounded-t-none border-x-0 border-b-0"
              onClick={() => setAbrir('partida')}>
              Añadir partida anterior
            </button>
          )}
        </div>
      </div>

      {/* Dinero */}
      <div>
        <p className="t-eyebrow mb-2">Dinero llevado</p>
        <div className="panel overflow-hidden py-0">
          {pagosLista.length === 0 ? (
            <p className="text-sm text-tx/50">Nadie ha llevado dinero todavía.</p>
          ) : (
            <ul>
              {pagosLista.map(m => (
                <li key={m.id} className="flex items-center gap-3 py-2.5 border-b border-br/25 last:border-0">
                  <span className="t-num text-xs text-tx/35 w-14">{corta(m.fecha)}</span>
                  <p className="flex-1 text-sm">{n(m.quien)}</p>
                  <span className="t-num text-sm text-ac">{dinero(m.monto)}</span>
                  <button className="chip px-2 text-xs text-tx/35"
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
            <button className="btn btn-ac w-full rounded-t-none" onClick={() => setAbrir('dinero')}>
              Alguien llevó dinero
            </button>
          )}
        </div>
      </div>

      <button className="w-full t-eyebrow text-tx/35 py-2" onClick={() => setAjustes(!ajustes)}>
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
          className={`chip py-2 ${valor === g.id ? 'bg-ac text-bg border-ac' : ''}`}>
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
    <div className="px-3.5 py-4 border-t border-br space-y-3.5">
      <h3 className="t-display text-base text-ac">¿Quién llevó dinero?</h3>
      <Gente players={players} valor={quien} onCambiar={setQuien} />

      {quien && (
        <>
          <div className="flex gap-2">
            {[20, 50, 100].map(v => (
              <button key={v} onClick={() => setMonto(v)}
                className={`chip flex-1 py-2.5 t-num ${monto === v ? 'bg-ac text-bg border-ac' : ''}`}>
                ${v}
              </button>
            ))}
            <input type="number" inputMode="decimal" min="0" placeholder="otro"
              value={[20, 50, 100].includes(monto) ? '' : (monto ?? '')}
              onChange={e => setMonto(Number(e.target.value) || null)}
              className="t-num w-20 bg-s1 border border-br/25 rounded-sm px-3 text-center text-sm" />
          </div>
          {otra ? (
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="t-num w-full bg-s1 border border-br/25 rounded-sm px-3 py-2" />
          ) : (
            <button className="t-eyebrow text-tx/40" onClick={() => setOtra(true)}>
              hoy · cambiar fecha
            </button>
          )}
        </>
      )}

      <div className="flex gap-2">
        <button className="btn btn-ghost flex-1 text-sm" onClick={onCerrar}>Cancelar</button>
        <button className="btn btn-ac flex-1 text-sm" disabled={!quien || !monto}
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
    <div className="px-3.5 py-4 border-t border-br space-y-3.5">
      <h3 className="t-display text-base text-ac">¿A quién le tocaba pagar?</h3>
      <Gente players={players} valor={quien} onCambiar={setQuien} />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="t-eyebrow mb-1">Cuándo</p>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="t-num w-full bg-s1 border border-br/25 rounded-sm px-3 py-2" />
        </div>
        <div>
          <p className="t-eyebrow mb-1">Costó</p>
          <input type="number" inputMode="decimal" value={monto}
            onChange={e => setMonto(e.target.value)}
            className="t-num w-full bg-s1 border border-br/25 rounded-sm px-3 py-2" />
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-ghost flex-1 text-sm" onClick={onCerrar}>Cancelar</button>
        <button className="btn btn-ac flex-1 text-sm" disabled={!quien || !(Number(monto) > 0)}
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
          className="t-num flex-1 bg-s1 border border-br/25 rounded-sm px-3 py-2" />
        <button className="btn btn-ghost text-sm" onClick={() => onGuardar(Number(v) || 0)}>
          Guardar
        </button>
      </div>
    </div>
  );
}
