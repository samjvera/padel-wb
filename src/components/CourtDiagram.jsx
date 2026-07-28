// Geometría oficial: 20 m x 10 m, red al centro, líneas de saque a 6.95 m de la red.
// Escala: 1 m = 10 unidades → 200 x 100.
const L = '#FBFAF7';

function Player({ x, y, name, anchor = 'middle' }) {
  return (
    <g>
      <circle cx={x} cy={y} r="7.5" fill="#B33A2B" />
      <circle cx={x} cy={y} r="7.5" fill="none" stroke="#FBFAF7" strokeWidth=".9" />
      <text x={x} y={y + 2.6} textAnchor="middle" fontSize="7.5" fontWeight="700"
        fill="#FBFAF7" fontFamily="Archivo, sans-serif">
        {name.slice(0, 1).toUpperCase()}
      </text>
      <text x={x} y={y + 17} textAnchor={anchor} fontSize="7" fill={L}
        fontFamily="'IBM Plex Mono', monospace" letterSpacing=".04em">
        {name}
      </text>
    </g>
  );
}

export default function CourtDiagram({ teamA = [], teamB = [], scoreA, scoreB }) {
  return (
    <svg viewBox="-6 -14 212 128" className="w-full" role="img"
      aria-label={`${teamA.join(' y ')} contra ${teamB.join(' y ')}`}>
      {/* superficie y reja, dibujadas como en un plano */}
      <rect x="0" y="0" width="200" height="100" fill="#2F6B7A" />
      <rect x="0" y="0" width="200" height="100" fill="none"
        stroke="#171A1E" strokeWidth="1.6" />

      {/* líneas de saque y línea central de servicio */}
      <line x1="30.5" y1="0" x2="30.5" y2="100" stroke={L} strokeWidth="1" />
      <line x1="169.5" y1="0" x2="169.5" y2="100" stroke={L} strokeWidth="1" />
      <line x1="30.5" y1="50" x2="169.5" y2="50" stroke={L} strokeWidth="1" />

      {/* red */}
      <line x1="100" y1="0" x2="100" y2="100" stroke="#FBFAF7" strokeWidth="1.8" />
      {Array.from({ length: 11 }, (_, i) => (
        <line key={i} x1="97" y1={i * 10} x2="103" y2={i * 10}
          stroke="rgba(251,250,247,.35)" strokeWidth=".5" />
      ))}

      {/* jugadores */}
      {teamA[0] && <Player x="58" y="27" name={teamA[0]} />}
      {teamA[1] && <Player x="58" y="66" name={teamA[1]} />}
      {teamB[0] && <Player x="142" y="27" name={teamB[0]} />}
      {teamB[1] && <Player x="142" y="66" name={teamB[1]} />}

      {/* marcador sobre la cancha */}
      {scoreA != null && scoreB != null && (
        <>
          <text x="72" y="-3" textAnchor="middle" fontSize="15" fill="#B33A2B"
            fontFamily="'IBM Plex Mono', monospace" fontWeight="600">{scoreA}</text>
          <text x="100" y="-3" textAnchor="middle" fontSize="10" fill="#5A6068"
            fontFamily="'IBM Plex Mono', monospace">–</text>
          <text x="128" y="-3" textAnchor="middle" fontSize="15" fill="#B33A2B"
            fontFamily="'IBM Plex Mono', monospace" fontWeight="600">{scoreB}</text>
        </>
      )}
      <text x="0" y="112" fontSize="7" fill="#5A6068"
        fontFamily="'IBM Plex Mono', monospace" letterSpacing=".14em">IZQUIERDA</text>
      <text x="200" y="112" textAnchor="end" fontSize="7" fill="#5A6068"
        fontFamily="'IBM Plex Mono', monospace" letterSpacing=".14em">DERECHA</text>
    </svg>
  );
}
