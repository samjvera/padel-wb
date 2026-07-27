import { useState } from 'react';
import { deudas, repartir, nuevoId } from '../lib/ledger';
import { colaDePago } from '../lib/payments';
import { guardarLedger } from '../lib/firebase';

const dinero = n => `$${Math.abs(n).toFixed(2).replace(/\.00$/, '')}`;
const hoy = () => new Date().toISOString().slice(0, 10);
const aFecha = s => new Date(s + 'T12:00:00').getTime();
const deFecha = t => new Date(t).toISOString().slice(0, 10);

export default function Cuentas({ ledger, players, pagos }) {
  const [abrir, setAbrir] = useState(null);
  const mov = ledger?.movimientos || [];
  const costo = ledger?.costoNoche ?? 20;
  const n = id => players[id]?.name ?? id;

  const d = deudas(mov);
  const guardar = nuevos => guardarLedger({ costoNoche: costo, movimientos: nuevos });
  const anadir = m => guardar([{ ...m, id: nuevoId() }, ...mov]);
  const borrar = id => guardar(mov.filter(m => m.id !== id));

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
          <ul className="space-y-1">
            {d.lista.map((x, i) => (
              <li key={i} className="flex items-center gap-2 py-2.5 border-b border-glass/25 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <b>{n(x.de)}</b>
                    <span className="text-line/40"> le debe a </span>
                    <b>{n(x.a)}</b>
                  </p>
                  {x.motivos.length > 0 && (
                    <p className="t-num text-xs text-line/40 truncate">
                      {x.motivos.join(' · ')}
                    </p>
                  )}
                </div>
                <span className="t-num text-flood font-semibold">{dinero(x.monto)}</span>
                <button className="chip px-2 text-xs"
                  title="Ya pagó"
                  onClick={() => anadir({ tipo: 'traspaso', quien: x.de, para: x.a,
                    monto: x.monto, fecha: Date.now() })}>✓</button>
              </li>
            ))}
          </ul>
        )}

        {d.sinPagar > 0.005 && (
          <p className="text-xs text-flood mt-3">
            Quedan {dinero(d.sinPagar)} de cancha sin poner. Alguien tiene que llevar dinero.
          </p>
        )}
        {d.sobrante > 0.005 && (
          <p className="text-xs text-line/50 mt-3">
            Hay {dinero(d.sobrante)} a favor del grupo
            {costo > 0 && ` — cubre ${(d.sobrante / costo).toFixed(1)} noches más`}.
          </p>
        )}
      </div>

      <div className="court-rule" />

      <div className="grid grid-cols-2 gap-2">
        <button className="btn btn-flood text-sm" onClick={() => setAbrir('pago')}>
          Alguien puso dinero
        </button>
        <button className="btn btn-ghost text-sm" onClick={() => setAbrir('cargo')}>
          Registrar noche
        </button>
      </div>
      <button className="btn btn-ghost w-full text-sm" onClick={() => setAbrir('traspaso')}>
        Alguien le devolvió a otro
      </button>

      {abrir && (
        <Formulario tipo={abrir} players={players} costo={costo} pagos={pagos}
          onCerrar={() => setAbrir(null)}
          onGuardar={m => { anadir(m); setAbrir(null); }} />
      )}

      <Reparto mov={mov} n={n} />
      <Ajustes costo={costo} onCambiar={c => guardarLedger({ costoNoche: c, movimientos: mov })} />
      <Movimientos mov={mov} n={n} onBorrar={borrar} />
    </section>
  );
}

function Formulario({ tipo, players, costo, pagos, onCerrar, onGuardar }) {
  const gente = Object.values(players).filter(p => p.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
  const sugerido = colaDePago(players, pagos?.paidCount || {}, pagos?.order)[0]?.id;

  const [quien, setQuien] = useState(tipo === 'cargo' ? (sugerido ?? gente[0]?.id) : gente[0]?.id);
  const [para, setPara] = useState(gente[1]?.id);
  const [monto, setMonto] = useState(tipo === 'cargo' ? String(costo) : '');
  const [fecha, setFecha] = useState(hoy());

  const titulo = { pago: 'Alguien puso dinero', traspaso: 'Devolución entre dos personas',
    cargo: 'Registrar una noche de cancha' }[tipo];
  const etiqueta = { pago: 'Quién puso el billete', traspaso: 'Quién devuelve',
    cargo: 'A quién le tocaba esa noche' }[tipo];
  const valido = quien && Number(monto) > 0 && (tipo !== 'traspaso' || (para && para !== quien));

  return (
    <div className="panel p-4 space-y-3">
      <p className="t-eyebrow">{titulo}</p>

      <Selector etiqueta={etiqueta} gente={gente} valor={quien} onCambiar={setQuien} />
      {tipo === 'traspaso' && (
        <Selector etiqueta="A quién" gente={gente.filter(g => g.id !== quien)}
          valor={para} onCambiar={setPara} />
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="t-eyebrow mb-1">Cuánto</p>
          <input type="number" inputMode="decimal" min="0" value={monto}
            onChange={e => setMonto(e.target.value)} placeholder="0"
            className="t-num w-full bg-night/60 border border-glass/50 rounded-lg px-3 py-2" />
        </div>
        <div>
          <p className="t-eyebrow mb-1">Cuándo</p>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            className="t-num w-full bg-night/60 border border-glass/50 rounded-lg px-3 py-2" />
        </div>
      </div>
      <p className="text-xs text-line/40">
        La fecha importa: el dinero va tapando las noches de la más vieja a la más nueva.
      </p>

      <div className="flex gap-2">
        <button className="btn btn-ghost flex-1 text-sm" onClick={onCerrar}>Cancelar</button>
        <button className="btn btn-flood flex-1 text-sm" disabled={!valido}
          onClick={() => onGuardar({ tipo, quien, para: tipo === 'traspaso' ? para : null,
            monto: Number(monto), fecha: aFecha(fecha),
            semana: tipo === 'cargo' ? fecha : null })}>
          Guardar
        </button>
      </div>
    </div>
  );
}

function Selector({ etiqueta, gente, valor, onCambiar }) {
  return (
    <div>
      <p className="t-eyebrow mb-1">{etiqueta}</p>
      <div className="flex flex-wrap gap-1.5">
        {gente.map(g => (
          <button key={g.id} onClick={() => onCambiar(g.id)}
            className={`chip ${valor === g.id ? 'bg-flood text-night border-flood' : ''}`}>
            {g.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Reparto({ mov, n }) {
  const [abierto, setAbierto] = useState(false);
  const { cargos } = repartir(mov);
  if (!cargos.length) return null;

  return (
    <div className="panel p-4">
      <button className="flex w-full items-center justify-between" onClick={() => setAbierto(!abierto)}>
        <span className="t-eyebrow">Qué billete pagó qué noche</span>
        <span className="t-num text-xs text-line/40">{abierto ? '−' : '+'}</span>
      </button>
      {abierto && (
        <ul className="mt-3 space-y-2">
          {cargos.map((c, i) => (
            <li key={i} className="py-2 border-t border-glass/25">
              <p className="text-sm">
                {c.semana || 'noche'} · le tocaba a <b>{n(c.quien)}</b>
              </p>
              <p className="t-num text-xs text-line/45 mt-0.5">
                {c.cubiertoPor.length
                  ? c.cubiertoPor.map(p => `${dinero(p.monto)} de ${n(p.quien)}`).join('  +  ')
                  : 'sin pagar'}
                {c.restante > 0.005 && `  ·  faltan ${dinero(c.restante)}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Ajustes({ costo, onCambiar }) {
  const [abierto, setAbierto] = useState(false);
  const [v, setV] = useState(String(costo));
  return (
    <div className="panel p-4">
      <button className="flex w-full items-center justify-between" onClick={() => setAbierto(!abierto)}>
        <span className="t-eyebrow">Cuánto cuesta una noche</span>
        <span className="t-num text-flood">{dinero(costo)}</span>
      </button>
      {abierto && (
        <div className="flex gap-2 mt-3">
          <input type="number" inputMode="decimal" value={v} onChange={e => setV(e.target.value)}
            className="t-num flex-1 bg-night/60 border border-glass/50 rounded-lg px-3 py-2" />
          <button className="btn btn-flood text-sm"
            onClick={() => { onCambiar(Number(v) || 0); setAbierto(false); }}>Guardar</button>
        </div>
      )}
    </div>
  );
}

function Movimientos({ mov, n, onBorrar }) {
  const [todos, setTodos] = useState(false);
  if (!mov.length) return null;
  const lista = [...mov].sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
  const ver = todos ? lista : lista.slice(0, 6);

  const texto = m => m.tipo === 'cargo' ? `Noche a cuenta de ${n(m.quien)}`
    : m.tipo === 'pago' ? `${n(m.quien)} puso dinero`
    : `${n(m.quien)} le devolvió a ${n(m.para)}`;

  return (
    <div className="panel p-4">
      <p className="t-eyebrow">Movimientos</p>
      <ul className="mt-2">
        {ver.map(m => (
          <li key={m.id} className="flex items-center gap-2 py-2 border-t border-glass/25">
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{texto(m)}</p>
              <p className="t-num text-xs text-line/40">{m.fecha ? deFecha(m.fecha) : ''}</p>
            </div>
            <span className={`t-num text-sm ${m.tipo === 'cargo' ? 'text-line/50' : 'text-flood'}`}>
              {m.tipo === 'cargo' ? '−' : '+'}{dinero(m.monto)}
            </span>
            <button className="chip px-2 text-xs text-line/40"
              onClick={() => onBorrar(m.id)} title="Borrar">×</button>
          </li>
        ))}
      </ul>
      {lista.length > 6 && (
        <button className="btn btn-ghost w-full mt-3 text-xs py-2" onClick={() => setTodos(!todos)}>
          {todos ? 'Ver menos' : `Ver los ${lista.length}`}
        </button>
      )}
    </div>
  );
}
