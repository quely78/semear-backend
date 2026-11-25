// =============================================================
// components/graficos/GraficoLinha.jsx — Uma série ao longo dos meses.
// Linha de 2px, área suave embaixo, ponto no último valor com o número.
// Meses sem dado (null) ficam em branco: a linha não inventa valor.
// Passar o dedo/mouse mostra uma linha vertical no mês mais próximo.
// =============================================================
import { useState } from 'react';
import { COR, escala } from '../../utils/graficos';
import TabelaDoGrafico from './TabelaDoGrafico';
import useLargura from './useLargura';

const MARGEM = { topo: 20, direita: 40, baixo: 24, esquerda: 44 };

export default function GraficoLinha({
  titulo,
  nome,
  rotulos,
  rotulosLongos,
  valores,
  formatar,
  formatarEixo = formatar,
  cor = COR.principal,
  altura = 170,
}) {
  const [ref, largura] = useLargura();
  const [ativo, setAtivo] = useState(null);

  const existentes = valores.filter((v) => v !== null && v !== undefined);
  const minimo = Math.min(0, ...existentes);
  const { max, ticks: ticksPositivos } = escala(Math.max(...existentes, 0) || 1);
  // Valores negativos (ex.: margem com prejuízo): o eixo desce abaixo de zero
  const passo = ticksPositivos[1] - ticksPositivos[0];
  const min = minimo < 0 ? -passo * Math.ceil(-minimo / passo) : 0;
  const ticks = [];
  for (let t = min; t <= max + passo / 2; t += passo) ticks.push(Math.round(t * 1000) / 1000);

  const larguraPlot = largura - MARGEM.esquerda - MARGEM.direita;
  const alturaPlot = altura - MARGEM.topo - MARGEM.baixo;
  const n = rotulos.length;
  const x = (i) => MARGEM.esquerda + (n === 1 ? larguraPlot / 2 : (i / (n - 1)) * larguraPlot);
  const y = (v) => MARGEM.topo + alturaPlot - ((v - min) / (max - min)) * alturaPlot;
  const nomesMes = rotulosLongos || rotulos;

  // Trechos contínuos (um mês sem dado quebra a linha)
  const trechos = [];
  let atual = [];
  valores.forEach((v, i) => {
    if (v === null || v === undefined) {
      if (atual.length) trechos.push(atual);
      atual = [];
    } else atual.push(i);
  });
  if (atual.length) trechos.push(atual);

  const ultimo = valores.reduce((achado, v, i) => (v !== null && v !== undefined ? i : achado), -1);
  const pularRotulo = larguraPlot / n < 22 ? 2 : 1;

  /** Mês mais próximo do ponteiro. */
  function aoMover(evento) {
    const caixa = evento.currentTarget.getBoundingClientRect();
    const px = evento.clientX - caixa.left;
    const i = Math.round(((px - MARGEM.esquerda) / larguraPlot) * (n - 1));
    setAtivo(Math.min(Math.max(i, 0), n - 1));
  }

  function aoTeclar(evento) {
    if (evento.key === 'ArrowRight') setAtivo((i) => Math.min((i ?? -1) + 1, n - 1));
    if (evento.key === 'ArrowLeft') setAtivo((i) => Math.max((i ?? n) - 1, 0));
  }

  const valorAtivo = ativo !== null ? valores[ativo] : null;

  return (
    <div className="grafico-painel">
      <div ref={ref} className="grafico-painel__area">
        <svg
          width={largura}
          height={altura}
          role="img"
          tabIndex={0}
          aria-label={`${titulo}. Setas para a esquerda e a direita percorrem os meses.`}
          onPointerMove={aoMover}
          onPointerLeave={() => setAtivo(null)}
          onKeyDown={aoTeclar}
          onBlur={() => setAtivo(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={MARGEM.esquerda}
                x2={largura - MARGEM.direita}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? COR.eixo : COR.grade}
                strokeWidth="1"
              />
              <text x={MARGEM.esquerda - 6} y={y(t)} dy="0.32em" textAnchor="end" className="grafico-painel__eixo">
                {formatarEixo(t)}
              </text>
            </g>
          ))}

          {trechos.map((trecho) => {
            const linha = trecho.map((i, k) => `${k ? 'L' : 'M'}${x(i)},${y(valores[i])}`).join('');
            const area = `${linha}L${x(trecho[trecho.length - 1])},${y(Math.max(min, 0))}L${x(trecho[0])},${y(Math.max(min, 0))}Z`;
            return (
              <g key={trecho[0]}>
                <path d={area} fill={cor} opacity="0.1" />
                <path d={linha} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {/* Mês isolado (sem vizinhos): ponto, para não sumir */}
                {trecho.length === 1 && <circle cx={x(trecho[0])} cy={y(valores[trecho[0]])} r="3" fill={cor} />}
              </g>
            );
          })}

          {rotulos.map((r, i) =>
            i % pularRotulo === 0 ? (
              <text key={`${r}-${i}`} x={x(i)} y={altura - 6} textAnchor="middle" className="grafico-painel__eixo">
                {r}
              </text>
            ) : null,
          )}

          {/* Último valor: ponto com anel e o número ao lado */}
          {ultimo >= 0 && ativo === null && (
            <g>
              <circle cx={x(ultimo)} cy={y(valores[ultimo])} r="6" fill={COR.papel} />
              <circle cx={x(ultimo)} cy={y(valores[ultimo])} r="4" fill={cor} />
              <text x={x(ultimo) + 8} y={y(valores[ultimo])} dy="0.32em" className="grafico-painel__valor">
                {formatar(valores[ultimo])}
              </text>
            </g>
          )}

          {/* Linha vertical no mês em foco */}
          {ativo !== null && (
            <g>
              <line x1={x(ativo)} x2={x(ativo)} y1={MARGEM.topo} y2={MARGEM.topo + alturaPlot} stroke={COR.eixo} strokeWidth="1" />
              {valorAtivo !== null && valorAtivo !== undefined && (
                <>
                  <circle cx={x(ativo)} cy={y(valorAtivo)} r="6" fill={COR.papel} />
                  <circle cx={x(ativo)} cy={y(valorAtivo)} r="4" fill={cor} />
                </>
              )}
            </g>
          )}
        </svg>

        {!existentes.length && <p className="grafico-painel__vazio">Sem dados neste período.</p>}

        {ativo !== null && (
          <div
            className="grafico-painel__dica"
            style={{ left: Math.min(Math.max(x(ativo), 70), largura - 70) }}
            role="status"
          >
            <p className="grafico-painel__dica-titulo">{nomesMes[ativo]}</p>
            <p className="grafico-painel__dica-linha">
              <span className="grafico-painel__dica-chave" style={{ background: cor }} aria-hidden="true" />
              <strong>{valorAtivo === null || valorAtivo === undefined ? 'sem dado' : formatar(valorAtivo)}</strong>
              <span>{nome}</span>
            </p>
          </div>
        )}
      </div>

      <TabelaDoGrafico
        cabecalhos={['Mês', nome]}
        linhas={nomesMes.map((m, i) => [m, valores[i] === null || valores[i] === undefined ? '—' : formatar(valores[i])])}
      />
    </div>
  );
}
