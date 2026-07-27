// Generador de Americano para 1 cancha (4 slots por ronda).
// Objetivo: máxima variedad de parejas, balance estricto de partidos jugados.

function combinations(arr, k) {
  const res = [];
  const rec = (start, acc) => {
    if (acc.length === k) { res.push([...acc]); return; }
    for (let i = start; i < arr.length; i++) { acc.push(arr[i]); rec(i + 1, acc); acc.pop(); }
  };
  rec(0, []);
  return res;
}

// Las 3 formas de partir 4 jugadores en 2 parejas
const SPLITS = [[[0,1],[2,3]], [[0,2],[1,3]], [[0,3],[1,2]]];

function key(a, b) { return a < b ? `${a}|${b}` : `${b}|${a}`; }

function buildSchedule(n, rounds, rng) {
  const partner = new Map();   // pareja -> veces juntos
  const opponent = new Map();  // par -> veces enfrentados
  const played = new Array(n).fill(0);
  const lastPlayedRound = new Array(n).fill(-99);
  const schedule = [];

  const get = (m, k) => m.get(k) || 0;

  for (let r = 0; r < rounds; r++) {
    // Balance estricto: solo elegibles los de menor número de partidos
    const sorted = [...played].sort((a, b) => a - b);
    const threshold = sorted[3];
    const eligible = [];
    for (let i = 0; i < n; i++) if (played[i] <= threshold) eligible.push(i);

    let best = null, bestCost = Infinity, ties = 0;

    for (const quad of combinations(eligible, 4)) {
      for (const split of SPLITS) {
        const t1 = [quad[split[0][0]], quad[split[0][1]]];
        const t2 = [quad[split[1][0]], quad[split[1][1]]];

        let cost = 0;
        // repetir pareja: castigo fuerte y superlineal
        for (const t of [t1, t2]) {
          const c = get(partner, key(t[0], t[1]));
          cost += 1000 * (c * c);
        }
        // repetir rival: castigo medio
        for (const a of t1) for (const b of t2) {
          const c = get(opponent, key(a, b));
          cost += 60 * (c * c);
        }
        // preferir a quien lleva más tiempo sentado
        for (const p of quad) cost += 8 * played[p] + 3 * (r - lastPlayedRound[p] > 1 ? -1 : 0);

        if (cost < bestCost - 1e-9) { bestCost = cost; best = [t1, t2]; ties = 1; }
        else if (Math.abs(cost - bestCost) < 1e-9) { ties++; if (rng() < 1 / ties) best = [t1, t2]; }
      }
    }

    const [t1, t2] = best;
    const quad = [...t1, ...t2];
    for (const t of [t1, t2]) partner.set(key(t[0], t[1]), get(partner, key(t[0], t[1])) + 1);
    for (const a of t1) for (const b of t2) opponent.set(key(a, b), get(opponent, key(a, b)) + 1);
    for (const p of quad) { played[p]++; lastPlayedRound[p] = r; }
    const resting = [];
    for (let i = 0; i < n; i++) if (!quad.includes(i)) resting.push(i);
    schedule.push({ round: r + 1, teamA: t1, teamB: t2, resting });
  }

  return { schedule, partner, opponent, played };
}

function scoreSchedule({ partner, opponent, played }, n) {
  let dup = 0, missing = 0;
  const allPairs = combinations([...Array(n).keys()], 2);
  for (const [a, b] of allPairs) {
    const c = partner.get(key(a, b)) || 0;
    if (c === 0) missing++;
    if (c > 1) dup += (c - 1) * (c - 1);
  }
  let oppDup = 0;
  for (const [a, b] of allPairs) {
    const c = opponent.get(key(a, b)) || 0;
    if (c > 1) oppDup += (c - 1) * (c - 1);
  }
  const spread = Math.max(...played) - Math.min(...played);
  return { cost: dup * 1000 + missing * 100 + oppDup * 10 + spread * 5000, dup, missing, oppDup, spread };
}

export function generateAmericano(players, rounds, seed = 12345) {
  const n = players.length;
  if (n < 4) throw new Error('Mínimo 4 jugadores');
  let s = seed;
  const rng = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;

  let best = null, bestScore = null;
  const restarts = n <= 6 ? 400 : 1200;
  for (let i = 0; i < restarts; i++) {
    const cand = buildSchedule(n, rounds, rng);
    const sc = scoreSchedule(cand, n);
    if (!bestScore || sc.cost < bestScore.cost) { best = cand; bestScore = sc; }
    if (bestScore.cost === 0) break;
  }

  return {
    rounds: best.schedule.map(r => ({
      round: r.round,
      teamA: r.teamA.map(i => players[i]),
      teamB: r.teamB.map(i => players[i]),
      resting: r.resting.map(i => players[i]),
    })),
    quality: bestScore,
    gamesPlayed: Object.fromEntries(players.map((p, i) => [p, best.played[i]])),
  };
}

// Rondas recomendadas para 1 cancha, slot de 90 min, partidos de 16 puntos
// (~9-10 min por ronda contando cambios). Ver README para el análisis.
export const RONDAS_SUGERIDAS = { 4: 6, 5: 5, 6: 8, 7: 8, 8: 8 };
export function rondasSugeridas(n) { return RONDAS_SUGERIDAS[n] ?? Math.max(3, Math.floor(80 / 10)); }
