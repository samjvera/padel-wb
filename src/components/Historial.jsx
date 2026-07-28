import { useState } from 'react';
import { calcularTabla } from '../lib/tabla';
import { fechaDe, DIAS, SLOTS } from '../lib/week';

const mayus = t => t.charAt(0).toUpperCase() + t.slice(1);

/** Día real en que se jugó. Si no consta, cae a la semana. */
function cuando(wid, semana) {
  const dia = (semana?.cellId || '').split(':')[0];
  if (!dia || !DIAS.some(d => d.id === dia)) {
    const m = /^(\d{4})-W(\d{2})$/.exec(wid);
    return m ? `Semana ${Number(m[2])} de ${m[1]}` : wid;
  }
  const f = fechaDe(wid, dia);
  const hoy = new Date();
  return mayus(f.toLocaleDateString('es', {
    weekday: 'long', day: 'numeric', month: 'long',
    ...(f.getFullYear() !== hoy.getFullYear() ? { year: 'numeric' } : {}),
  }));
}

const horario = semana => {
  const slot = (semana?.cellId || '').split(':')[1];
  return SLOTS.find(s => s.id === slot)?.short ?? null;
};

export default function Historial({ sesiones = [], semanas = {}, actual }) {
  const [abierta, setAbierta] = useState(null);

  const pasadas = sesiones
    .filter(s => s.id !== actual && (s.rounds || []).length)
    .map(s => ({ ...s, ...calcularTabla(s.rounds, s.results || {}, s.pointsPerMatch ?? 16) }))
    .filter(s => s.conResultado > 0);

  if (!pasadas.length) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="t-section">Partidas anteriores</p>
        <span className="t-num text-xs text-tx/35">{pasadas.length}</span>
      </div>

      <div className="panel p-4">
        <ul>
          {pasadas.map(s => {
            const ganador = s.tabla[0];
            const abierto = abierta === s.id;
            return (
              <li key={s.id} className="border-b border-br/25 last:border-0">
                <button className="w-full flex items-center gap-3 py-3 text-left"
                  onClick={() => setAbierta(abierto ? null : s.id)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-base">{cuando(s.id, semanas[s.id])}</p>
                    <p className="t-num text-micro text-t3">
                      {horario(semanas[s.id]) && `${horario(semanas[s.id])} · `}
                      {s.tabla.length} jugadores · {s.conResultado} rondas
                    </p>
                  </div>
                  <span className="text-tiny truncate max-w-[7rem] text-t2">{ganador?.p}</span>
                  <span className="badge badge-ac">1º</span>
                  <span className="t-num text-micro text-t3">{abierto ? '−' : '+'}</span>
                </button>

                {abierto && (
                  <table className="tabla pb-2">
                    <thead>
                      <tr>
                        <th className="w-7"></th>
                        <th>Jugador</th>
                        <th>G</th>
                        <th>P</th>
                        <th className="pr-3.5">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.tabla.map((r, i) => (
                        <tr key={r.p} className="border-t border-br/20">
                          <td className="t-num py-1.5 text-tx/35 text-xs">{i + 1}</td>
                          <td className={`py-1.5 ${i === 0 ? 'text-ac' : ''}`}>{r.p}</td>
                          <td className="t-num py-1.5 text-right text-tx/50 whitespace-nowrap">
                            {r.g}-{r.pe}-{r.e}
                          </td>
                          <td className={`t-num py-1.5 text-right ${i === 0 ? 'text-ac font-semibold' : ''}`}>
                            {r.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
