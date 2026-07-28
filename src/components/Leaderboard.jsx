import { calcularTabla } from '../lib/tabla';

export default function Leaderboard({ session }) {
  const rounds = session?.rounds || [];
  const puntos = session?.pointsPerMatch ?? 16;
  const { tabla, conResultado: rondasConResultado, promedio: promedioRonda, hayMplus } =
    calcularTabla(rounds, session?.results || {}, puntos);

  if (rondasConResultado === 0) {
    return (
      <div className="panel p-5 text-center">
        <p className="t-display text-lg">Sin resultados aún</p>
        <p className="text-sm text-ink/55 mt-1.5">
          Anota el marcador de la ronda 1 y la tabla aparece aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between">
        <p className="t-section">Tabla de la partida</p>
        <span className="t-num text-xs text-ink/45">
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
        <tbody className="rayado">
          {tabla.map((r, i) => (
            <tr key={r.p} className="border-t border-rule/25">
              <td className="t-num py-2 text-ink/40 text-xs">{i + 1}</td>
              <td className={`py-2 ${i === 0 ? 'text-stamp font-semibold' : ''}`}>{r.p}</td>
              <td className="t-num py-2 text-right text-ink/55 whitespace-nowrap">
                {r.g}-{r.pe}-{r.e}
              </td>
              {hayMplus && (
                <td className="t-num py-2 text-right text-ink/55">
                  {r.mplus > 0 ? `+${r.mplus}` : '—'}
                </td>
              )}
              <td className="t-num py-2 text-right text-ink/55">
                {r.diff > 0 ? `+${r.diff}` : r.diff}
              </td>
              <td className={`t-num py-2 text-right font-semibold ${i === 0 ? 'text-stamp' : ''}`}>
                {r.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-ink/45 mt-3 leading-relaxed">
        G-P-E = ganados, perdidos, empatados. A igualdad de puntos desempata quien
        ganó más partidos.
        {hayMplus && ` M+ compensa a quien jugó menos rondas: ${promedioRonda} puntos
        por cada ronda que se perdió, el promedio de lo que reparte un partido.`}
      </p>
    </div>
  );
}
