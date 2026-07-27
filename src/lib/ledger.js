// Cuenta corriente del grupo, siguiendo el dinero.
//
// La idea: cada noche tiene un dueño (a quien le tocaba) y un precio.
// Cuando alguien pone un billete, ese dinero va tapando las noches
// pendientes en orden, de la más vieja a la más nueva — que es justo
// lo que pasa en la vida real.
//
// Si Matías pone 50 y con eso se cubren la noche de Santiago, la de
// Samuel y la mitad de la suya, entonces Santiago le debe 20 a Matías
// y Samuel le debe 20 a Matías. No hace falta calcular nada más:
// la deuda queda pegada a quien puso el dinero.
//
// Los traspasos (devoluciones entre personas) van borrando esas deudas.

export const TIPOS = {
  cargo: 'Noche de cancha',
  pago: 'Puso dinero',
  traspaso: 'Le devolvió a alguien',
};

const orden = m => m.orden ?? m.fecha ?? 0;

/**
 * Reparte cada pago entre las noches pendientes, de la más vieja a la
 * más nueva. Devuelve, para cada noche, quién puso el dinero.
 */
export function repartir(movimientos = []) {
  const cargos = movimientos.filter(m => m.tipo === 'cargo')
    .sort((a, b) => orden(a) - orden(b))
    .map(c => ({ ...c, restante: Number(c.monto) || 0, cubiertoPor: [] }));

  const pagos = movimientos.filter(m => m.tipo === 'pago')
    .sort((a, b) => orden(a) - orden(b))
    .map(p => ({ ...p, restante: Number(p.monto) || 0 }));

  let i = 0;
  for (const pago of pagos) {
    while (pago.restante > 0.005 && i < cargos.length) {
      const c = cargos[i];
      if (c.restante <= 0.005) { i++; continue; }
      const cuanto = Math.min(pago.restante, c.restante);
      c.cubiertoPor.push({ quien: pago.quien, monto: cuanto });
      c.restante -= cuanto;
      pago.restante -= cuanto;
      if (c.restante <= 0.005) i++;
    }
  }

  const sobrante = pagos.reduce((a, p) => a + p.restante, 0);
  const sinPagar = cargos.reduce((a, c) => a + c.restante, 0);
  return { cargos, sobrante, sinPagar };
}

/**
 * Quién le debe a quién, con el motivo.
 * Deuda = a ti te tocaba una noche y la pagó otro.
 */
export function deudas(movimientos = []) {
  const { cargos, sobrante, sinPagar } = repartir(movimientos);
  const mapa = new Map();   // "deudor→acreedor" -> { monto, motivos[] }

  const sumar = (de, a, monto, motivo) => {
    if (de === a || monto <= 0.005) return;
    const k = `${de}→${a}`;
    const e = mapa.get(k) || { de, a, monto: 0, motivos: [] };
    e.monto += monto;
    if (motivo) e.motivos.push(motivo);
    mapa.set(k, e);
  };

  for (const c of cargos) {
    for (const parte of c.cubiertoPor) {
      sumar(c.quien, parte.quien, parte.monto, c.semana || null);
    }
  }

  // Las devoluciones borran deuda; si se devuelve de más, se invierte.
  for (const t of movimientos.filter(m => m.tipo === 'traspaso')) {
    const monto = Number(t.monto) || 0;
    const k = `${t.quien}→${t.para}`;
    const e = mapa.get(k);
    if (e) {
      e.monto -= monto;
      if (e.monto <= 0.005) {
        mapa.delete(k);
        if (e.monto < -0.005) sumar(t.para, t.quien, -e.monto, 'devolvió de más');
      }
    } else {
      sumar(t.para, t.quien, monto, 'devolvió de más');
    }
  }

  return {
    lista: [...mapa.values()].filter(d => d.monto > 0.005)
      .sort((a, b) => b.monto - a.monto),
    sobrante,
    sinPagar,
  };
}

/** Resumen por persona: cuánto le deben menos cuánto debe. */
export function saldos(movimientos = [], jugadores = []) {
  const s = Object.fromEntries(jugadores.map(id => [id, 0]));
  for (const d of deudas(movimientos).lista) {
    if (d.de in s) s[d.de] -= d.monto;
    if (d.a in s) s[d.a] += d.monto;
  }
  return s;
}

/** Noches que el grupo lleva pagadas por adelantado. */
export function nochesCubiertas(movimientos = [], costoNoche = 0) {
  if (!costoNoche) return 0;
  return deudas(movimientos).sobrante / costoNoche;
}

export const nuevoId = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
