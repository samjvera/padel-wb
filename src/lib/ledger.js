// Cuenta corriente del grupo.
//
// Todo se reduce a tres tipos de movimiento:
//
//   cargo     — a alguien le tocaba pagar una noche y esa noche cuesta X.
//   pago      — alguien le entregó dinero al club (o a quien cobra la cancha).
//   traspaso  — alguien le devolvió dinero a otro directamente.
//
// El saldo de cada uno es: lo que ha puesto  −  lo que le han cargado.
//   saldo positivo → puso de más, le deben
//   saldo negativo → debe
//
// La suma de todos los saldos siempre da cero. Si no da cero, hay un
// movimiento mal metido, y la app lo avisa.

export const TIPOS = {
  cargo: 'Noche de cancha',
  pago: 'Pagó la cancha',
  traspaso: 'Le pagó a alguien',
};

export function saldos(movimientos = [], jugadores = []) {
  const s = Object.fromEntries(jugadores.map(id => [id, 0]));
  const suma = (id, n) => { if (id != null) s[id] = (s[id] ?? 0) + n; };

  for (const m of movimientos) {
    const monto = Number(m.monto) || 0;
    if (m.tipo === 'cargo') suma(m.quien, -monto);
    else if (m.tipo === 'pago') suma(m.quien, +monto);
    else if (m.tipo === 'traspaso') { suma(m.quien, +monto); suma(m.para, -monto); }
  }
  return s;
}

/**
 * Menor número de transferencias que dejan todos los saldos a cero.
 * Empareja al que más debe con al que más le deben, repetidamente.
 */
export function liquidar(saldosMap, centavos = 0.01) {
  const deben = [], lesDeben = [];
  for (const [id, v] of Object.entries(saldosMap)) {
    if (v < -centavos) deben.push({ id, monto: -v });
    else if (v > centavos) lesDeben.push({ id, monto: v });
  }
  deben.sort((a, b) => b.monto - a.monto);
  lesDeben.sort((a, b) => b.monto - a.monto);

  const pagos = [];
  let i = 0, j = 0;
  while (i < deben.length && j < lesDeben.length) {
    const cuanto = Math.min(deben[i].monto, lesDeben[j].monto);
    pagos.push({ de: deben[i].id, a: lesDeben[j].id, monto: Math.round(cuanto * 100) / 100 });
    deben[i].monto -= cuanto;
    lesDeben[j].monto -= cuanto;
    if (deben[i].monto <= centavos) i++;
    if (lesDeben[j].monto <= centavos) j++;
  }
  return pagos;
}

/** Comprobación de integridad: los saldos tienen que sumar cero. */
export function cuadra(saldosMap) {
  const total = Object.values(saldosMap).reduce((a, b) => a + b, 0);
  return Math.abs(total) < 0.01;
}

/** Cuántas noches lleva pagadas por adelantado el conjunto del grupo. */
export function nochesCubiertas(movimientos = [], costoNoche = 0) {
  if (!costoNoche) return 0;
  const puesto = movimientos.filter(m => m.tipo === 'pago')
    .reduce((a, m) => a + (Number(m.monto) || 0), 0);
  const gastado = movimientos.filter(m => m.tipo === 'cargo')
    .reduce((a, m) => a + (Number(m.monto) || 0), 0);
  return (puesto - gastado) / costoNoche;
}

export const nuevoId = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
