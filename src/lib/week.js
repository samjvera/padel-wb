// La semana del grupo NO empieza a medianoche: empieza el LUNES a las
// 8:00 AM hora de Caracas. A esa hora la app pasa sola a una semana nueva
// y vuelve a estar en blanco. No hace falta ningún servidor: se calcula
// en el teléfono de cada quien, así que todos ven lo mismo a la vez.

const ZONA = 'America/Caracas';
const HORA_REINICIO = 8;

// Diferencia entre la hora de Caracas y UTC, en milisegundos.
// Se consulta al sistema en vez de fijarla, por si Venezuela vuelve a
// cambiar de huso horario algún día.
function desfaseCaracas(d) {
  const enUTC = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
  const enCaracas = new Date(d.toLocaleString('en-US', { timeZone: ZONA }));
  return enCaracas.getTime() - enUTC.getTime();
}

/** Identificador de la semana en curso, por ejemplo "2026-W31". */
export function weekId(date = new Date()) {
  // Pasamos a hora de Caracas y retrocedemos las 8 horas del reinicio:
  // así el lunes antes de las 8 AM todavía cuenta como la semana anterior.
  const t = date.getTime() + desfaseCaracas(date) - HORA_REINICIO * 3600000;
  const d = new Date(t);

  const dia = d.getUTCDay() || 7;
  const jueves = new Date(d);
  jueves.setUTCDate(d.getUTCDate() + 4 - dia);
  const inicioAno = new Date(Date.UTC(jueves.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((jueves - inicioAno) / 86400000 + 1) / 7);
  return `${jueves.getUTCFullYear()}-W${String(semana).padStart(2, '0')}`;
}

/** Momento exacto del próximo reinicio, en hora local del dispositivo. */
export function proximoReinicio(date = new Date()) {
  const desfase = desfaseCaracas(date);
  const enCaracas = new Date(date.getTime() + desfase);
  const d = new Date(enCaracas);
  d.setUTCHours(HORA_REINICIO, 0, 0, 0);
  const diasHastaLunes = (8 - (d.getUTCDay() || 7)) % 7;
  d.setUTCDate(d.getUTCDate() + diasHastaLunes);
  if (d.getTime() <= enCaracas.getTime()) d.setUTCDate(d.getUTCDate() + 7);
  return new Date(d.getTime() - desfase);
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
