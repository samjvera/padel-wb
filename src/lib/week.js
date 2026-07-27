// Semana ISO: la app se organiza por semanas que arrancan el lunes.
export function weekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export const DIAS = [
  { id: 'lun', label: 'Lunes', short: 'L' },
  { id: 'mar', label: 'Martes', short: 'M' },
  { id: 'mie', label: 'Miércoles', short: 'X' },
  { id: 'jue', label: 'Jueves', short: 'J' },
  { id: 'vie', label: 'Viernes', short: 'V' },
];

export const SLOTS = [
  { id: 'temprano', label: '7:00 – 8:30 PM', short: '7:00 PM' },
  { id: 'tarde', label: '8:30 – 10:00 PM', short: '8:30 PM' },
];

export const cellId = (dia, slot) => `${dia}:${slot}`;

// Cuenta confirmaciones por celda y devuelve las mejores opciones ordenadas.
export function rankSlots(availability) {
  const counts = {};
  for (const cells of Object.values(availability || {})) {
    for (const [cid, ok] of Object.entries(cells || {})) {
      if (ok) counts[cid] = (counts[cid] || 0) + 1;
    }
  }
  const rows = [];
  for (const d of DIAS) for (const s of SLOTS) {
    const cid = cellId(d.id, s.id);
    rows.push({ cid, dia: d, slot: s, count: counts[cid] || 0 });
  }
  return rows.sort((a, b) => b.count - a.count);
}

export function whoIsIn(availability, cid) {
  return Object.entries(availability || {})
    .filter(([, cells]) => cells?.[cid])
    .map(([pid]) => pid);
}

// Fecha real del día elegido dentro de una semana ISO ("2026-W31" + "jue")
export function fechaDe(wid, diaId) {
  const [y, w] = wid.split('-W').map(Number);
  const ene4 = new Date(y, 0, 4);
  const lunesSem1 = new Date(ene4);
  lunesSem1.setDate(ene4.getDate() - ((ene4.getDay() + 6) % 7));
  const lunes = new Date(lunesSem1);
  lunes.setDate(lunesSem1.getDate() + (w - 1) * 7);
  const idx = DIAS.findIndex(d => d.id === diaId);
  const f = new Date(lunes);
  f.setDate(lunes.getDate() + (idx < 0 ? 0 : idx));
  return f;
}
