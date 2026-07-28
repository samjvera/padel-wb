// Tabla de una partida. Se usa tanto en la partida en curso como en el historial.
//
// M+ : quien jugó menos rondas recibe la mitad de los puntos del partido por
// cada ronda que se perdió, para que descansar no penalice el marcador.
//
// Desempate: victorias. Con puntos fijos por partido la diferencia se deduce
// de los puntos y los partidos jugados, así que nunca puede desempatar.

export function calcularTabla(rounds = [], results = {}, puntos = 16) {
  const jug = [...new Set(rounds.flatMap(r => [...r.teamA, ...r.teamB, ...(r.resting || [])]))];
  const t = Object.fromEntries(jug.map(p => [p, { pts: 0, jugadas: 0, diff: 0, g: 0, pe: 0, e: 0 }]));

  let conResultado = 0;
  rounds.forEach((r, i) => {
    const res = results[i];
    if (!Array.isArray(res)) return;
    conResultado++;
    const [sa, sb] = res;
    const marca = (p, mio, suyo) => {
      t[p].pts += mio; t[p].jugadas++; t[p].diff += mio - suyo;
      if (mio > suyo) t[p].g++; else if (mio < suyo) t[p].pe++; else t[p].e++;
    };
    r.teamA.forEach(p => marca(p, sa, sb));
    r.teamB.forEach(p => marca(p, sb, sa));
  });

  const maxJugadas = Math.max(0, ...jug.map(p => t[p].jugadas));
  const promedio = puntos / 2;

  const tabla = jug
    .map(p => {
      const mplus = Math.round((maxJugadas - t[p].jugadas) * promedio);
      return { p, ...t[p], mplus, total: t[p].pts + mplus };
    })
    .sort((x, y) => y.total - x.total || y.g - x.g || y.diff - x.diff);

  return { tabla, conResultado, promedio, hayMplus: tabla.some(r => r.mplus > 0) };
}
