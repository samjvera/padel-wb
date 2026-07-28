// A quién le toca pagar.
//
// Una sola fuente de verdad: las partidas registradas en las cuentas.
// Si una partida está a nombre de Santiago, ese fue su turno — lo haya
// pagado él o se lo haya cubierto otro. Eso es lo que hace avanzar la cola.
//
// Paga siempre quien menos turnos ha tenido; a igualdad, el que esté antes
// en el orden. Si te toca y no vas, tu contador no sube, así que sigues
// arriba hasta que juegues.

export const ORDEN_BASE = ['ricardo', 'arturo', 'enrique', 'santiago', 'samuel', 'matias'];

/** Cuántas veces le ha tocado a cada uno, contando partidas registradas. */
export function turnos(movimientos = []) {
  const n = {};
  for (const m of movimientos) {
    if (m.tipo === 'cargo' && m.quien) n[m.quien] = (n[m.quien] || 0) + 1;
  }
  return n;
}

export function elegirPagador(confirmedIds, players, movimientos = [], orden = ORDEN_BASE) {
  const t = turnos(movimientos);
  return confirmedIds
    .map(id => players[id])
    .filter(p => p && p.gender === 'M' && !p.isGuest && p.active !== false)
    .map(p => ({
      id: p.id,
      veces: t[p.id] ?? 0,
      pos: orden.indexOf(p.id) === -1 ? 999 : orden.indexOf(p.id),
    }))
    .sort((a, b) => a.veces - b.veces || a.pos - b.pos)[0]?.id ?? null;
}

export function colaDePago(players, movimientos = [], orden = ORDEN_BASE) {
  const t = turnos(movimientos);
  return orden
    .filter(id => players[id] && players[id].active !== false)
    .map(id => ({ id, nombre: players[id].name, veces: t[id] ?? 0 }))
    .sort((a, b) => a.veces - b.veces || orden.indexOf(a.id) - orden.indexOf(b.id));
}
