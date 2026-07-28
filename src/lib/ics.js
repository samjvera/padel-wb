// Exporta la noche de partido al calendario del teléfono.
// Hora flotante (sin Z ni TZID): el evento cae a esa hora local en el
// dispositivo de cada quien y no se desplaza con el cambio horario.

const pad = n => String(n).padStart(2, '0');

const fmtLocal = d =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T` +
  `${pad(d.getHours())}${pad(d.getMinutes())}00`;

const fmtUTC = d =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
  `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

// RFC 5545: escapar \ ; , y saltos de línea en valores de texto
const esc = s => String(s)
  .replace(/\\/g, '\\\\').replace(/;/g, '\\;')
  .replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// RFC 5545: las líneas no pueden pasar de 75 octetos
function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let cur = '';
  for (const ch of line) {
    const test = cur + ch;
    if (new TextEncoder().encode(test).length > (out.length ? 74 : 75)) {
      out.push(cur); cur = ch;
    } else cur = test;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const build = lines => lines.flatMap(l => fold(l).split('\r\n')).join('\r\n') + '\r\n';

/** Evento único de la noche de partido. */
export function icsPartido({ fecha, slot, jugadores, pagador, url }) {
  const inicio = new Date(fecha);
  const [h, m] = slot === 'temprano' ? [19, 0] : [20, 30];
  inicio.setHours(h, m, 0, 0);
  const fin = new Date(inicio.getTime() + 90 * 60000);

  const desc = [
    `Confirmados (${jugadores.length}): ${jugadores.join(', ')}`,
    pagador ? `Paga la cancha: ${pagador}` : 'Pago: a definir',
    '',
    `Cuadro y marcadores: ${url}`,
  ].join('\n');

  return build([
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cancha//Padel//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:partido-${fmtLocal(inicio)}@cancha`,
    `DTSTAMP:${fmtUTC(new Date())}`,
    `DTSTART:${fmtLocal(inicio)}`,
    `DTEND:${fmtLocal(fin)}`,
    `SUMMARY:${esc('Pádel — americano')}`,
    `DESCRIPTION:${esc(desc)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT3H', 'ACTION:DISPLAY',
    `DESCRIPTION:${esc('Pádel en 3 horas')}`, 'END:VALARM',
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY',
    `DESCRIPTION:${esc('Pádel en 30 minutos')}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ]);
}

export function descargar(contenido, nombre) {
  const blob = new Blob([contenido], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
