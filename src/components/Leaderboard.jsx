import { calcularTabla } from '../lib/tabla';

export default function Leaderboard({ session }) {
  const rounds = session?.rounds || [];
  const puntos = session?.pointsPerMatch ?? 16;
  const { tabla, conResultado: rondasConResultado, promedio: promedioRonda, hayMplus } =
    calcularTabla(rounds, session?.results || {}, puntos);

  if (rondasConResultado === 0) {
    return (
      <div className="panel px-3.5 py-6 text-center">
        <p className="t-eyebrow">Clasificación</p>
        <p className="text-tiny text-t3 mt-2">
          Anota el marcador de la ronda 1 y aparece aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-br">
        <span className="t-eyebrow">Clasificación</span>
        <span className="t-num text-micro text-t3">
          {rondasConResultado}/{rounds.length} rondas
        </span>
      </div>

      <table className="tabla">
        <thead>
          <tr>
            <th className="w-7">#</th>
            <th>Jugador</th>
            <th>PJ</th>
            <th>G</th>
            <th>P</th>
            {hayMplus && <th>M+</th>}
            <th>Dif</th>
            <th className="pr-3.5">Pts</th>
          </tr>
        </thead>
        <tbody>
          {tabla.map((r, i) => (
            <tr key={r.p} className={i === 0 ? 'bg-ac/[0.06]' : ''}>
              <td className="t-num text-t3 pl-3.5">{i + 1}</td>
              <td className={`font-${i === 0 ? 'semibold' : 'normal'} whitespace-nowrap`}>{r.p}</td>
              <td className="t-num text-t2">{r.jugadas}</td>
              <td className="t-num text-t2">{r.g}</td>
              <td className="t-num text-t2">{r.pe}</td>
              {hayMplus && (
                <td className="t-num text-t2">{r.mplus > 0 ? `+${r.mplus}` : '·'}</td>
              )}
              <td className="t-num text-t2">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
              <td className={`t-num pr-3.5 font-semibold ${i === 0 ? 'text-ac' : ''}`}>{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-micro text-t3 px-3.5 py-2.5 border-t border-br leading-relaxed">
        Desempata por victorias.
        {hayMplus && ` M+ compensa a quien jugó menos rondas: ${promedioRonda} pts por ronda perdida.`}
      </p>
    </div>
  );
}
