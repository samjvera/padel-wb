import { useState } from 'react';
import { deudas, repartir, saldos, nuevoId } from '../lib/ledger';
import { colaDePago, elegirPagador, ORDEN_BASE } from '../lib/payments';
import { guardarLedger, guardarOrden } from '../lib/firebase';

const dinero = n => `$${Math.abs(n).toFixed(2).replace(/\.00$/, '')}`;
const hoy = () => new Date().toISOString().slice(0, 10);
const aFecha = s => new Date(s + 'T12:00:00').getTime();
const corta = t => new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short' });

export default function Cuentas({ ledger, players, pagos, week }) {
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
    <section className="space-y-4">
      <header>
        <p className="t-section">Cuentas</p>
        <h2 className="t-display text-3xl mt-1">Quién le debe a quién</h2>
      </header>

      {/* Deudas */}
      <div className="panel overflow-hidden">
        <div className="panel-cab">
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
            <NuevaPartida players={players} pagos={pagos} mov={mov} costo={costo}
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
      <div className="panel overflow-hidden">
        <div className="panel-cab">
          <div>
            <span className="t-eyebrow">Billetes que se han puesto</span>
            <p className="text-micro text-t3 mt-0.5 normal-case tracking-normal">
              Quién entregó dinero, no de quién era el turno
            </p>
          </div>
        </div>
        <div>
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
      {ajustes && (
        <>
          <Precio costo={costo} onGuardar={p => guardar(mov, p)} />
          <OrdenCola players={players} orden={pagos?.order} />
        </>
      )}
    </section>
  );
}

function Rotacion({ players, mov, pagos, week, n }) {
  const [abierto, setAbierto] = useState(true);
  const orden = pagos?.order;
  const cola = colaDePago(players, mov, orden);
  const saldo = saldos(mov, cola.map(c => c.id));
  const asignado = week?.status === 'fijada'
    ? week?.payerId
    : elegirPagador(cola.map(c => c.id), players, mov, orden);

  if (!cola.length) return null;

  const estado = id => {
    const v = saldo[id] || 0;
    if (v < -0.005) return { txt: `debe ${dinero(v)}`, cls: 'text-wn' };
    if (v > 0.005) return { txt: `le deben ${dinero(v)}`, cls: 'text-ac' };
    return { txt: 'al día', cls: 'text-t3' };
  };

  return (
    <div className="panel overflow-hidden">
      <button className="panel-cab w-full" onClick={() => setAbierto(!abierto)}>
        <span className="t-eyebrow">
          {week?.status === 'fijada' ? 'Paga esta partida' : 'Le toca a'}
        </span>
        <span className="t-num text-micro text-t3">{abierto ? '−' : '+'}</span>
      </button>

      <div className="fila">
        <span className="text-lg font-semibold flex-1">
          {asignado ? n(asignado) : 'Nadie de la rotación'}
        </span>
        {week?.status === 'fijada' && asignado && (
          <span className="badge badge-wn">asignado</span>
        )}
      </div>

      {abierto && (
        <>
          <ul>
            {cola.map((c, i) => {
              const e = estado(c.id);
              return (
                <li key={c.id} className="fila">
                  <span className="t-num text-tiny text-t3 w-4">{i + 1}</span>
                  <span className="flex-1 text-base truncate">{c.nombre}</span>
                  <span className="t-num text-tiny text-t2 w-16 text-right">
                    {c.veces} {c.veces === 1 ? 'turno' : 'turnos'}
                  </span>
                  <span className={`t-num text-tiny w-24 text-right ${e.cls}`}>{e.txt}</span>
                </li>
              );
            })}
          </ul>
          <p className="panel-pie">
            <b className="text-t2">Turnos</b> = veces que le ha tocado, contando las
            partidas registradas abajo. Decide el orden de la cola.
            <br />
            <b className="text-t2">Al día</b> = ya no debe nada: o llevó su propio
            dinero, o ya le devolvió a quien lo puso por él.
          </p>
        </>
      )}
    </div>
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

function NuevaPartida({ players, pagos, mov, costo, onCerrar, onGuardar }) {
  const sugerido = colaDePago(players, mov, pagos?.order)[0]?.id;
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

/** El orden que decide los empates de turnos. Editable con flechas. */
function OrdenCola({ players, orden }) {
  const elegibles = Object.values(players)
    .filter(p => p.gender === 'M' && !p.isGuest && p.active !== false)
    .map(p => p.id);

  // El orden guardado, más cualquiera que falte por el final
  const base = (orden?.length ? orden : ORDEN_BASE).filter(id => elegibles.includes(id));
  const inicial = [...base, ...elegibles.filter(id => !base.includes(id))];
  const [lista, setLista] = useState(inicial);
  const [guardado, setGuardado] = useState(false);

  const mover = (i, d) => {
    if (i + d < 0 || i + d >= lista.length) return;
    const c = [...lista];
    [c[i], c[i + d]] = [c[i + d], c[i]];
    setLista(c);
    setGuardado(false);
  };

  const cambiado = JSON.stringify(lista) !== JSON.stringify(inicial);

  return (
    <div className="panel overflow-hidden">
      <div className="panel-cab">
        <span className="t-eyebrow">Orden de la cola</span>
        {guardado && <span className="badge badge-ac">guardado</span>}
      </div>
      <ul>
        {lista.map((id, i) => (
          <li key={id} className="fila">
            <span className="t-num text-tiny text-t3 w-4">{i + 1}</span>
            <span className="flex-1 text-base">{players[id]?.name ?? id}</span>
            <button className="chip px-2.5 py-1" onClick={() => mover(i, -1)}
              disabled={i === 0} aria-label="Subir">↑</button>
            <button className="chip px-2.5 py-1" onClick={() => mover(i, 1)}
              disabled={i === lista.length - 1} aria-label="Bajar">↓</button>
          </li>
        ))}
      </ul>
      <div className="px-4 py-3 border-t border-br">
        <p className="text-micro text-t3 leading-relaxed mb-3">
          Solo decide quién paga cuando dos llevan los mismos turnos. Quien menos
          turnos tenga va siempre primero, esté donde esté en esta lista.
        </p>
        <button className="btn btn-ac w-full text-tiny" disabled={!cambiado}
          onClick={async () => { await guardarOrden(lista); setGuardado(true); }}>
          Guardar orden
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
