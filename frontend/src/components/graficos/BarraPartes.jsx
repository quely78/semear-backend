// =============================================================
// components/graficos/BarraPartes.jsx — Um todo dividido em partes
// (ex.: área no campo = crescendo + pronto + atrasado).
// Barra de 28px; cada parte mostra a sua % dentro quando cabe.
// Embaixo, a lista com nome e valor de cada parte (é a "tabela").
// =============================================================
import { useState } from 'react';
import useLargura from './useLargura';

const porcento = (parte, total) =>
  `${Math.round((parte / total) * 100).toLocaleString('pt-BR')}%`;

/** Texto branco ou quase preto, pelo quão clara é a cor de fundo. */
function corDoTexto(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? '#22301f' : '#ffffff';
}

export default function BarraPartes({ titulo, partes, formatar }) {
  const [ref, largura] = useLargura();
  const [ativa, setAtiva] = useState(null);
  const total = partes.reduce((soma, p) => soma + p.valor, 0);
  const visiveis = partes.filter((p) => p.valor > 0);
  const espaco = 2;
  const util = largura - espaco * Math.max(visiveis.length - 1, 0);

  return (
    <div className="barra-partes">
      <div ref={ref} className="barra-partes__barra" role="img" aria-label={`${titulo}: ${partes.map((p) => `${p.nome} ${formatar(p.valor)}`).join(', ')}`}>
        {total === 0 ? (
          <span className="barra-partes__vazia" />
        ) : (
          visiveis.map((p) => {
            const w = (p.valor / total) * util;
            return (
              <span
                key={p.nome}
                className={`barra-partes__parte ${ativa === p.nome ? 'barra-partes__parte--ativa' : ''}`}
                style={{ width: w, background: p.cor, color: corDoTexto(p.cor) }}
                onPointerEnter={() => setAtiva(p.nome)}
                onPointerLeave={() => setAtiva(null)}
                title={`${p.nome}: ${formatar(p.valor)} (${porcento(p.valor, total)})`}
              >
                {w >= 44 ? porcento(p.valor, total) : ''}
              </span>
            );
          })
        )}
      </div>
      <ul className="barra-partes__lista">
        {partes.map((p) => (
          <li key={p.nome} className={ativa === p.nome ? 'barra-partes__item--ativo' : ''}>
            <span className="grafico-painel__chave" style={{ background: p.cor }} aria-hidden="true" />
            <span className="barra-partes__nome">{p.nome}</span>
            <strong>{formatar(p.valor)}</strong>
            <span className="barra-partes__pct">{total ? porcento(p.valor, total) : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
