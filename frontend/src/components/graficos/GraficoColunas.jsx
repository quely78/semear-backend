// =============================================================
// components/graficos/GraficoColunas.jsx — Colunas por mês (1 ou 2 séries).
//
//   <GraficoColunas
//     titulo="Entradas e saídas do estoque"
//     rotulos={['jan', 'fev', ...]}
//     series={[{ nome: 'Colhido', cor: COR.principal, valores: [..] }, ...]}
//     formatar={formatarKg}
//   />
//
// - colunas finas (até 24px), ponta arredondada e base reta;
// - tocar/passar o mouse num mês mostra todas as séries daquele mês;
// - com 2 séries, a legenda é um filtro: tocar em "Colhido" mostra só ele;
// - "Ver em tabela" mostra os mesmos números sem depender do gráfico.
// =============================================================
import { useState } from 'react';
import { COR, compacto, escala } from '../../utils/graficos';
import TabelaDoGrafico from './TabelaDoGrafico';
import useLargura from './useLargura';

const MARGEM = { topo: 18, direita: 4, baixo: 24, esquerda: 44 };

/** Coluna com cantos de cima arredondados (4px) e base reta. */
function caminhoColuna(x, y, largura, altura) {
  if (altura <= 0) return '';
  const r = Math.min(4, largura / 2, altura);
  return `M${x},${y + altura}V${y + r}Q${x},${y} ${x + r},${y}H${x + largura - r}Q${x + largura},${y} ${x + largura},${y + r}V${y + altura}Z`;
}

export default function GraficoColunas({ titulo, rotulos, rotulosLongos, series: todas, formatar, altura = 190 }) {
  const [ref, largura] = useLargura();
  const [ativo, setAtivo] = useState(null);
  const [ocultas, setOcultas] = useState([]); // nomes das séries escondidas pela legenda
  const visiveis = todas.filter((s) => !ocultas.includes(s.nome));
  const series = visiveis.length ? visiveis : todas;

  /** Liga/desliga uma série (sempre fica pelo menos uma na tela). */
  function alternar(nome) {
    setOcultas((atuais) => {
      if (atuais.includes(nome)) return atuais.filter((n) => n !== nome);
      return todas.length - atuais.length > 1 ? [...atuais, nome] : atuais;
    });
  }

  const todos = series.flatMap((s) => s.valores);
  const { max, ticks } = escala(Math.max(...todos, 0));
  const larguraPlot = largura - MARGEM.esquerda - MARGEM.direita;
  const alturaPlot = altura - MARGEM.topo - MARGEM.baixo;
  const faixa = larguraPlot / rotulos.length;
  const espaco = 2; // vão entre colunas do mesmo mês
  const larguraColuna = Math.min(24, (faixa * 0.72 - espaco * (series.length - 1)) / series.length);
  const larguraGrupo = larguraColuna * series.length + espaco * (series.length - 1);
  const y = (v) => MARGEM.topo + alturaPlot - (v / max) * alturaPlot;
  // Com muitos meses e tela estreita, mostra um rótulo sim, outro não
  const pularRotulo = faixa < 22 ? 2 : 1;

  // Rótulo direto só no maior valor da série principal
  const principal = series[0].valores;
  const indicePico = principal.indexOf(Math.max(...principal));
  const vazio = !todos.some((v) => v > 0);

  const nomesMes = rotulosLongos || rotulos;

  return (
    <div className="grafico-painel">
      {todas.length > 1 && (
        <ul className="grafico-painel__legenda" aria-label="Mostrar no gráfico">
          {todas.map((s) => {
            const ligada = !ocultas.includes(s.nome);
            return (
              <li key={s.nome} className={ligada ? '' : 'grafico-painel__legenda-item--oculta'}>
                <button
                  type="button"
                  className="grafico-painel__filtro"
                  aria-pressed={ligada}
                  onClick={() => alternar(s.nome)}
                  title={ligada ? `Esconder ${s.nome}` : `Mostrar ${s.nome}`}
                >
                  <span className="grafico-painel__chave" style={{ background: s.cor }} aria-hidden="true" />
                  {s.nome}
                </button>
              </li>
            );
          })}
          {ocultas.length > 0 && (
            <li>
              <button type="button" className="grafico-painel__filtro grafico-painel__filtro--todos" onClick={() => setOcultas([])}>
                Mostrar todos
              </button>
            </li>
          )}
        </ul>
      )}

      <div ref={ref} className="grafico-painel__area">
        <svg
          width={largura}
          height={altura}
          role="img"
          aria-label={`${titulo}. Use "Ver em tabela" para ler os valores.`}
          onPointerLeave={() => setAtivo(null)}
        >
          {/* Grade e eixo Y (linhas finas e discretas) */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(t)} y2={y(t)} stroke={COR.grade} strokeWidth="1" />
              <text x={MARGEM.esquerda - 6} y={y(t)} dy="0.32em" textAnchor="end" className="grafico-painel__eixo">
                {compacto(t)}
              </text>
            </g>
          ))}

          {rotulos.map((rotulo, i) => {
            const xFaixa = MARGEM.esquerda + i * faixa;
            const xGrupo = xFaixa + (faixa - larguraGrupo) / 2;
            return (
              <g key={`${rotulo}-${i}`}>
                {/* Fundo do mês em foco */}
                {ativo === i && (
                  <rect x={xFaixa} y={MARGEM.topo} width={faixa} height={alturaPlot} fill={COR.grade} opacity="0.45" rx="4" />
                )}
                {series.map((s, k) => {
                  const v = s.valores[i] || 0;
                  const topo = y(v);
                  return (
                    <path
                      key={s.nome}
                      d={caminhoColuna(xGrupo + k * (larguraColuna + espaco), topo, larguraColuna, MARGEM.topo + alturaPlot - topo)}
                      fill={s.cor}
                    />
                  );
                })}
                {i % pularRotulo === 0 && (
                  <text x={xFaixa + faixa / 2} y={altura - 6} textAnchor="middle" className="grafico-painel__eixo">
                    {rotulo}
                  </text>
                )}
                {/* Área de toque: o mês inteiro, maior que a coluna */}
                <rect
                  x={xFaixa}
                  y={MARGEM.topo}
                  width={faixa}
                  height={alturaPlot}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${nomesMes[i]}: ${series.map((s) => `${s.nome} ${formatar(s.valores[i] || 0)}`).join(', ')}`}
                  onPointerEnter={() => setAtivo(i)}
                  onFocus={() => setAtivo(i)}
                  onBlur={() => setAtivo(null)}
                />
              </g>
            );
          })}

          {/* Linha de base */}
          <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(0)} y2={y(0)} stroke={COR.eixo} strokeWidth="1" />

          {/* Rótulo direto: o pico da série principal */}
          {!vazio && ativo === null && principal[indicePico] > 0 && (
            <text
              x={MARGEM.esquerda + indicePico * faixa + faixa / 2}
              y={y(principal[indicePico]) - 6}
              textAnchor="middle"
              className="grafico-painel__valor"
            >
              {compacto(principal[indicePico])}
            </text>
          )}
        </svg>

        {vazio && <p className="grafico-painel__vazio">Sem movimento neste período.</p>}

        {/* Dica do mês em foco: valor em destaque, nome da série em segundo plano */}
        {ativo !== null && (
          <div
            className="grafico-painel__dica"
            style={{ left: Math.min(Math.max(MARGEM.esquerda + ativo * faixa + faixa / 2, 70), largura - 70) }}
            role="status"
          >
            <p className="grafico-painel__dica-titulo">{nomesMes[ativo]}</p>
            {series.map((s) => (
              <p key={s.nome} className="grafico-painel__dica-linha">
                <span className="grafico-painel__dica-chave" style={{ background: s.cor }} aria-hidden="true" />
                <strong>{formatar(s.valores[ativo] || 0)}</strong>
                <span>{s.nome}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <TabelaDoGrafico
        cabecalhos={['Mês', ...series.map((s) => s.nome)]}
        linhas={nomesMes.map((m, i) => [m, ...series.map((s) => formatar(s.valores[i] || 0))])}
      />
    </div>
  );
}
