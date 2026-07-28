import { useState } from 'react';
import { copiar } from '../lib/share';

export default function CopiarGrupo({ texto, etiqueta = 'Copiar mensaje para el grupo' }) {
  const [estado, setEstado] = useState('listo');

  async function onClick() {
    const ok = await copiar(texto);
    setEstado(ok ? 'copiado' : 'error');
    setTimeout(() => setEstado('listo'), 2500);
  }

  return (
    <div>
      <button className="btn btn-ghost w-full text-sm" onClick={onClick}>
        {estado === 'copiado' ? '✓ Copiado — pégalo en el grupo'
          : estado === 'error' ? 'No se pudo copiar, selecciona el texto abajo'
          : etiqueta}
      </button>
      {estado === 'error' && (
        <pre className="mt-2 p-3 text-xs bg-paper/60 border border-rule/40 rounded-lg
          whitespace-pre-wrap select-all font-mono text-ink/80">{texto}</pre>
      )}
    </div>
  );
}
