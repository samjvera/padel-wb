import { useState } from 'react';
import { saldos, liquidar, cuadra, nochesCubiertas, nuevoId } from '../lib/ledger';
import { colaDePago } from '../lib/payments';
import { guardarLedger } from '../lib/firebase';

const dinero = n => `$${Math.abs(n).toFixed(2).replace(/\.00$/, '')}`;

export default function Cuentas({ ledger, players, pagos }) {
  const [abrir, setAbrir] = useState(null);
  const mov = ledger?.movimientos || [];
  const costo = ledger?.costoNoche ?? 20;

  const ids = Object.values(players).filter(p => p.active !== false).map(p => p.id);
  const s = saldos(mov, ids);
  const cuentas = liquidar(s);
  const ok = cuadra(s);
  const cubiertas = nochesCubiertas(mov, costo);

  const conSaldo = ids.map(id => ({ id, v: s[id] || 0 }))
    .filter(x => Math.abs(x.v) > 0.005)
    .sort((a, b) => b.v - a.v);

  const guardar = async nuevos => guardarLedger({ costoNoche: costo, movimientos: nuevos });
  const anadir = m => guardar([{ ...m, id: nuevoId(), fecha: Date.now() }, ...mov]);
  const borrar = id => guardar(mov.filter(m => m.id !== id));

  return (
    <section className="space-y-5">
      <header>
        <p className="t-eyebrow">Cuentas</p>
        <h2 className="t-display text-3xl mt-1">Quién debe qué</h2>
      </header>

      {!ok && (
        <div className="panel p-4 border-flood/60">
          <p className="text-sm text-flood">
            Los saldos no suman cero. Falta registrar algún movimiento o hay uno mal metido.
          </p>
        </div>
      )}

      {/* Liquidación */}
      <div className="panel p-4">
        <p className="t-eyebrow">Para quedar en paz</p>
        {cuentas.length === 0 ? (
          <p className="t-display text-xl mt-2">Todo cuadrado</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {cuentas.map((c, i) => (
              <li key={i} className="flex items-center gap-2 py-2 border-t border-glass/25">
                <span className="flex-1 text-sm">
                  <b>{players[c.de]?.name}</b>
                  <span className="text-line/40"> le paga a </span>
                  <b>{players[c.a]?.name}</b>
                </span>
                <span className="t-num text-flood font-semibold">{dinero(c.monto)}</span>
                <button
                  className="chip px-2 text-xs"
                  onClick={() => anadir({ tipo: 'traspaso', quien: c.de, para: c.a, monto: c.monto })}
                  title="Marcar como pagado"
                >✓</button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-line/45 mt-3">
          Es el mínimo de transferencias para que nadie deba nada. Toca ✓ cuando alguien pague.
        </p>
      </div>

      {/* Saldos */}
      <div className="panel p-4">
        <p className="t-eyebrow">Saldo de cada uno</p>
        {conSaldo.length === 0 ? (
          <p className="text-sm text-line/55 mt-2">Nadie debe nada.</p>
        ) : (
          <ul className="mt-2">
            {conSaldo.map(({ id, v }) => (
              <li key={id} className="flex items-center justify-between py-2 border-t border-glass/25">
                <span className="text-sm">{players[id]?.name}</span>
                <span className={`t-num text-sm ${v > 0 ? 'text-flood' : 'text-line/50'}`}>
                  {v > 0 ? `le deben ${dinero(v)}` : `debe ${dinero(v)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
        {cubiertas > 0.01 && (
          <p className="text-xs text-line/45 mt-3">
            El grupo lleva {cubiertas.toFixed(1)} noche{cubiertas >= 2 ? 's' : ''} pagada
            {cubiertas >= 2 ? 's' : ''} por adelantado.
          </p>
        )}
      </div>

      <div className="court-rule" />

      {/* Registrar */}
      <div className="grid grid-cols-2 gap-2">
        <button className="btn btn-flood text-sm" onClick={() => setAbrir('pago')}>
          Pagó la cancha
        </button>
        <button className="btn btn-ghost text-sm" onClick={() => setAbrir('traspaso')}>
          Le pagó a alguien
        </button>
      </div>
      <button className="btn btn-ghost w-full text-sm" onClick={() => setAbrir('cargo')}>
        Registrar una noche
      </button>

      {abrir && (
        <Formulario
          tipo={abrir} players={players} costo={costo} pagos={pagos}
          onCerrar={() => setAbrir(null)}
          onGuardar={m => { anadir(m); setAbrir(null); }}
        />
      )}

      <Ajustes costo={costo} onCambiar={c => guardarLedger({ costoNoche: c, movimientos: mov })} />

      <Movimientos mov={mov} players={players} onBorrar={borrar} />
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
  const [nota, setNota] = useState('');

  const titulo = { pago: 'Alguien pagó la cancha', traspaso: 'Alguien le pagó a otro',
    cargo: 'Registrar una noche' }[tipo];
  const valido = quien && Number(monto) > 0 && (tipo !== 'traspaso' || (para && para !== quien));

  return (
    <div className="panel p-4 space-y-3">
      <p className="t-eyebrow">{titulo}</p>

      <Selector etiqueta={tipo === 'traspaso' ? 'Quién paga' : tipo === 'cargo' ? 'A quién le tocaba' : 'Quién puso el dinero'}
        gente={gente} valor={quien} onCambiar={setQuien} />

      {tipo === 'traspaso' && (
        <Selector etiqueta="A quién" gente={gente.filter(g => g.id !== quien)}
          valor={para} onCambiar={setPara} />
      )}

      <div>
        <p className="t-eyebrow mb-1">Cuánto</p>
        <input type="number" inputMode="decimal" min="0" step="1" value={monto}
          onChange={e => setMonto(e.target.value)} placeholder="0"
          className="t-num w-full bg-night/60 border border-glass/50 rounded-lg px-3 py-2" />
      </div>

      <input value={nota} onChange={e => setNota(e.target.value)}
        placeholder="Nota (opcional)"
        className="w-full bg-night/60 border border-glass/50 rounded-lg px-3 py-2 text-sm" />

      <div className="flex gap-2">
        <button className="btn btn-ghost flex-1 text-sm" onClick={onCerrar}>Cancelar</button>
        <button className="btn btn-flood flex-1 text-sm" disabled={!valido}
          onClick={() => onGuardar({ tipo, quien, para: tipo === 'traspaso' ? para : null,
            monto: Number(monto), nota: nota.trim() || null })}>
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
          <button className="btn btn-flood text-sm" onClick={() => { onCambiar(Number(v) || 0); setAbierto(false); }}>
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

function Movimientos({ mov, players, onBorrar }) {
  const [todos, setTodos] = useState(false);
  if (!mov.length) return null;
  const lista = todos ? mov : mov.slice(0, 8);

  const texto = m => {
    const n = id => players[id]?.name ?? id;
    if (m.tipo === 'cargo') return `Noche a cuenta de ${n(m.quien)}`;
    if (m.tipo === 'pago') return `${n(m.quien)} pagó la cancha`;
    return `${n(m.quien)} le pagó a ${n(m.para)}`;
  };

  return (
    <div className="panel p-4">
      <p className="t-eyebrow">Movimientos</p>
      <ul className="mt-2">
        {lista.map(m => (
          <li key={m.id} className="flex items-center gap-2 py-2 border-t border-glass/25">
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{texto(m)}</p>
              <p className="t-num text-xs text-line/40">
                {new Date(m.fecha).toLocaleDateString()}
                {m.nota && ` · ${m.nota}`}
              </p>
            </div>
            <span className={`t-num text-sm ${m.tipo === 'cargo' ? 'text-line/50' : 'text-flood'}`}>
              {m.tipo === 'cargo' ? '−' : '+'}{dinero(m.monto)}
            </span>
            <button className="chip px-2 text-xs text-line/40" onClick={() => onBorrar(m.id)}
              title="Borrar">×</button>
          </li>
        ))}
      </ul>
      {mov.length > 8 && (
        <button className="btn btn-ghost w-full mt-3 text-xs py-2" onClick={() => setTodos(!todos)}>
          {todos ? 'Ver menos' : `Ver los ${mov.length}`}
        </button>
      )}
    </div>
  );
}
