export default function Leaderboard({ session }) {
  const rounds = session?.rounds || [];
  const results = session?.results || {};
  const puntos = session?.pointsPerMatch ?? 16;

  const jugadores = [...new Set(rounds.flatMap(r => [...r.teamA, ...r.teamB, ...(r.resting || [])]))];
  const t = Object.fromEntries(jugadores.map(p => [p, { pts: 0, jugadas: 0, diff: 0, g: 0, pe: 0, e: 0 }]));

  let rondasConResultado = 0;
  rounds.forEach((r, i) => {
    const res = results[i];
    if (!Array.isArray(res)) return;
    rondasConResultado++;
    const [sa, sb] = res;
    const marca = (p, mio, suyo) => {
      t[p].pts += mio; t[p].jugadas++; t[p].diff += mio - suyo;
      if (mio > suyo) t[p].g++; else if (mio < suyo) t[p].pe++; else t[p].e++;
    };
    r.teamA.forEach(p => marca(p, sa, sb));
    r.teamB.forEach(p => marca(p, sb, sa));
  });

  // M+ : quien jugó menos partidos recibe el promedio de la ronda por cada uno que se perdió.
  const maxJugadas = Math.max(0, ...jugadores.map(p => t[p].jugadas));
  const promedioRonda = puntos / 2;
  const tabla = jugadores
    .map(p => {
      const mplus = Math.round((maxJugadas - t[p].jugadas) * promedioRonda);
      return { p, ...t[p], mplus, total: t[p].pts + mplus };
    })
    // Desempate: victorias, NO diferencia. Con puntos fijos por partido
    // Diff = 2·Pts − puntos·partidos, así que a igualdad de puntos y de
    // partidos jugados la diferencia es siempre idéntica: nunca desempata.
    .sort((x, y) => y.total - x.total || y.g - x.g || y.diff - x.diff);

  if (rondasConResultado === 0) {
    return (
      <div className="panel p-5 text-center">
        <p className="t-display text-lg">Sin resultados aún</p>
        <p className="text-sm text-line/55 mt-1.5">
          Anota el marcador de la ronda 1 y la tabla aparece aquí.
        </p>
      </div>
    );
  }

  const hayMplus = tabla.some(r => r.mplus > 0);

  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between">
        <p className="t-eyebrow">Tabla de la partida</p>
        <span className="t-num text-xs text-line/45">
          {rondasConResultado}/{rounds.length} rondas
        </span>
      </div>

      <table className="w-full mt-3 text-sm">
        <thead>
          <tr className="t-eyebrow text-left">
            <th className="font-normal pb-1.5 w-6"></th>
            <th className="font-normal pb-1.5">Jugador</th>
            <th className="font-normal pb-1.5 text-right">G-P-E</th>
            {hayMplus && <th className="font-normal pb-1.5 text-right">M+</th>}
            <th className="font-normal pb-1.5 text-right">Dif</th>
            <th className="font-normal pb-1.5 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {tabla.map((r, i) => (
            <tr key={r.p} className="border-t border-glass/25">
              <td className="t-num py-2 text-line/40 text-xs">{i + 1}</td>
              <td className={`py-2 ${i === 0 ? 'text-flood font-semibold' : ''}`}>{r.p}</td>
              <td className="t-num py-2 text-right text-line/55 whitespace-nowrap">
                {r.g}-{r.pe}-{r.e}
              </td>
              {hayMplus && (
                <td className="t-num py-2 text-right text-line/55">
                  {r.mplus > 0 ? `+${r.mplus}` : '—'}
                </td>
              )}
              <td className="t-num py-2 text-right text-line/55">
                {r.diff > 0 ? `+${r.diff}` : r.diff}
              </td>
              <td className={`t-num py-2 text-right font-semibold ${i === 0 ? 'text-flood' : ''}`}>
                {r.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-line/45 mt-3 leading-relaxed">
        G-P-E = ganados, perdidos, empatados. A igualdad de puntos desempata quien
        ganó más partidos.
        {hayMplus && ` M+ compensa a quien jugó menos rondas: ${promedioRonda} puntos
        por cada ronda que se perdió, el promedio de lo que reparte un partido.`}
      </p>
    </div>
  );
}
