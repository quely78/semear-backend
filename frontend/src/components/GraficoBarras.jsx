// =============================================================
// components/GraficoBarras.jsx — Gráfico de barras horizontais (RF09).
// Feito só com HTML e CSS (sem biblioteca), para carregar rápido.
//
// Recebe: itens = [{ especie: 'Milho', area: 120, quantidade: 5 }, ...]
// =============================================================
import { formatarArea } from '../utils/formatadores';

// Cores da identidade visual, usadas em sequência nas barras
const CORES = ['#355E3B', '#86AE3E', '#BE3E73', '#6E4B2A', '#68A771'];

export default function GraficoBarras({ itens }) {
  if (!itens?.length) {
    return <p className="texto-apoio">Ainda não há plantios para mostrar no gráfico.</p>;
  }

  // A maior área vira 100% da largura; as outras são proporcionais
  const maiorArea = Math.max(...itens.map((item) => item.area), 1);

  return (
    <ul className="grafico" aria-label="Área plantada por espécie">
      {itens.map((item, indice) => (
        <li key={item.especie} className="grafico__linha">
          <div className="grafico__legenda">
            <span>{item.especie}</span>
            <strong>{formatarArea(item.area)}</strong>
          </div>
          <div className="grafico__trilho">
            <div
              className="grafico__barra"
              style={{
                width: `${(item.area / maiorArea) * 100}%`,
                background: CORES[indice % CORES.length],
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}