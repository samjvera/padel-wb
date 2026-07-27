// Rotación de pago. Regla: solo varones no invitados.
// Si a alguien le toca y no juega, CONSERVA su turno: se elige siempre
// a quien menos veces ha pagado, desempatando por el orden fijo.
// Esto es auto-corrector: no hay puntero que se desincronice.

export const ORDEN_BASE = ['ricardo', 'arturo', 'enrique', 'santiago', 'samuel', 'matias'];

export function elegirPagador(confirmedIds, players, paidCount = {}, orden = ORDEN_BASE) {
  const candidatos = confirmedIds
    .map(id => players[id])
    .filter(p => p && p.gender === 'M' && !p.isGuest)
    .map(p => ({
      id: p.id,
      veces: paidCount[p.id] ?? 0,
      orden: orden.indexOf(p.id) === -1 ? 999 : orden.indexOf(p.id),
    }))
    .sort((a, b) => a.veces - b.veces || a.orden - b.orden);

  return candidatos[0]?.id ?? null;
}

// Cola visible: a quién le toca después, con los mismos criterios.
export function colaDePago(players, paidCount = {}, orden = ORDEN_BASE) {
  return orden
    .filter(id => players[id])
    .map(id => ({ id, nombre: players[id].name, veces: paidCount[id] ?? 0 }))
    .sort((a, b) => a.veces - b.veces || orden.indexOf(a.id) - orden.indexOf(b.id));
}
