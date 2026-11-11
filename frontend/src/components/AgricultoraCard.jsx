// =============================================================
// components/AgricultoraCard.jsx — Cartão de uma agricultora
// na lista da responsável pela comunidade.
//   [MS]  Maria Souza                              ›
//         3 plantios · 80 m² · 40 m² no campo
//         92 99999-0000
// Tocar no cartão abre o estoque filtrado por essa agricultora.
// =============================================================
import { Link } from 'react-router-dom';
import { formatarArea } from '../utils/formatadores';

/** "Maria Souza" → "MS" (iniciais para o círculo colorido). */
function iniciais(nome = '') {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

export default function AgricultoraCard({ agricultora }) {
  const total = Number(agricultora.totalPlantios) || 0;
  const emCampo = Number(agricultora.areaEmCampo) || 0;

  return (
    <Link
      to={`/coordenadora/estoque?agricultora=${agricultora.id}`}
      className="agricultora-card agricultora-card--link"
      aria-label={`${agricultora.nome}: ver estoque`}
    >
      <span
        className={`agricultora-card__avatar ${total ? '' : 'agricultora-card__avatar--inativa'}`}
        aria-hidden="true"
      >
        {iniciais(agricultora.nome)}
      </span>
      <div>
        <p className="agricultora-card__nome">{agricultora.nome}</p>
        <p className="agricultora-card__detalhe">
          {total
            ? `${total} ${total === 1 ? 'plantio' : 'plantios'} · ${formatarArea(agricultora.areaTotal)}`
            : 'Nenhum plantio registrado'}
          {emCampo > 0 && ` · ${formatarArea(emCampo)} no campo`}
        </p>
        {agricultora.contato && (
          <p className="agricultora-card__contato">{agricultora.contato}</p>
        )}
      </div>
      <span className="plantio-card__seta" aria-hidden="true">›</span>
    </Link>
  );
}
