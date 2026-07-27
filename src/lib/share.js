// Sin avisos automáticos, alguien pega el enlace en el grupo.
// Que al menos no tenga que escribir el mensaje.

import { DIAS, SLOTS, rankSlots } from './week';

export function textoSemanaAbierta(week, players, url) {
  const av = week.availability || {};
  const ranked = rankSlots(av).filter(r => r.count > 0).slice(0, 3);
  const marcaron = new Set(Object.keys(av).filter(id => Object.keys(av[id] || {}).length));
  const faltan = Object.values(players)
    .filter(p => p.active && !p.isGuest && !marcaron.has(p.id))
    .map(p => p.name);

  const lineas = ['🎾 Pádel — marquen sus horarios', ''];

  if (ranked.length) {
    lineas.push('Va ganando:');
    ranked.forEach(r => lineas.push(`· ${r.dia.label} ${r.slot.short} — ${r.count}`));
    lineas.push('');
  } else {
    lineas.push('Todavía no marcó nadie.', '');
  }

  if (faltan.length) lineas.push(`Faltan: ${faltan.join(', ')}`, '');
  lineas.push(url);
  return lineas.join('\n');
}

export function textoNocheFijada(week, players, url) {
  const [dia, slot] = (week.cellId || ':').split(':');
  const diaLabel = DIAS.find(d => d.id === dia)?.label ?? '';
  const slotLabel = SLOTS.find(s => s.id === slot)?.label ?? '';
  const nombres = (week.confirmed || []).map(id => players[id]?.name ?? id);
  const pagador = players[week.payerId]?.name;

  return [
    `🎾 Pádel — ${diaLabel} ${slotLabel}`,
    '',
    `Juegan (${nombres.length}): ${nombres.join(', ')}`,
    pagador ? `Paga la cancha: ${pagador}` : 'Pago: nadie de la rotación juega, arréglenlo entre ustedes',
    '',
    `Cuadro y marcadores: ${url}`,
  ].join('\n');
}

export async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Safari viejo y contextos sin permiso de portapapeles
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}
