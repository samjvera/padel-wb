import { colaDePago } from '../lib/payments';
import { confirmarPago } from '../lib/firebase';

export default function Payments({ wid, week, players, pagos }) {
  const paidCount = pagos?.paidCount || {};
  const history = pagos?.history || [];
  const cola = colaDePago(players, paidCount, pagos?.order);
  const yaPagoEstaSemana = history.some(h => h.weekId === wid);
  const pagador = week.payerId;

  return (
    <section className="space-y-5">
      <header>
        <p className="t-section">Rotación</p>
        <h2 className="t-display text-2xl mt-1">A quién le toca</h2>
      </header>

      {week.status === 'fijada' ? (
        pagador ? (
          <div className="panel p-5">
            <p className="t-eyebrow">Esta semana</p>
            <div className="flex items-center gap-3 mt-2">
              <p className="t-display text-4xl">{players[pagador]?.name}</p>
              <span className="badge badge-wn">paga</span>
            </div>
            <p className="text-sm text-tx/55 mt-2">
              Lleva {paidCount[pagador] ?? 0} pago{(paidCount[pagador] ?? 0) === 1 ? '' : 's'} en total.
            </p>
            <button
              className="btn btn-ac w-full mt-4"
              disabled={yaPagoEstaSemana}
              onClick={() => confirmarPago(wid, pagador, paidCount, history)}
            >
              {yaPagoEstaSemana ? 'Pago registrado' : 'Marcar como pagado'}
            </button>
          </div>
        ) : (
          <div className="panel p-5">
            <p className="t-display text-lg">Nadie de la rotación juega esta semana</p>
            <p className="text-sm text-tx/55 mt-1.5">
              Solo confirmaron mujeres o invitados. Decidan el pago entre ustedes —
              la rotación no avanza y todos conservan su turno.
            </p>
          </div>
        )
      ) : (
        <div className="panel p-5">
          <p className="t-display text-lg">Aún no hay día fijado</p>
          <p className="text-sm text-tx/55 mt-1.5">
            El pagador se asigna en el momento en que se fija el día.
          </p>
        </div>
      )}

      <div className="court-rule" />

      <div className="panel p-4">
        <p className="t-eyebrow">Orden de la cola</p>
        <p className="text-xs text-tx/45 mt-1.5 leading-relaxed">
          Paga siempre quien menos veces ha pagado. Si te toca y no vas, no pierdes el turno:
          sigues arriba hasta que juegues.
        </p>
        <ul className="mt-3">
          {cola.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 py-2 border-t border-br/25">
              <span className="t-num text-xs text-tx/40 w-4">{i + 1}</span>
              <span className={`flex-1 ${c.id === pagador ? 'text-ac font-semibold' : ''}`}>
                {c.nombre}
              </span>
              <span className="t-num text-xs text-tx/45">{c.veces}×</span>
            </li>
          ))}
        </ul>
      </div>

      {history.length > 0 && (
        <div className="panel p-4">
          <p className="t-eyebrow">Historial</p>
          <ul className="mt-2">
            {history.slice(0, 12).map((h, i) => (
              <li key={i} className="flex justify-between py-1.5 border-t border-br/25 text-sm">
                <span className="t-num text-tx/45 text-xs">{h.weekId}</span>
                <span>{players[h.playerId]?.name ?? h.playerId}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
