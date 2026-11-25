// =============================================================
// components/graficos/GraficoBarrasH.jsx — Barras horizontais com eixo.
//   itens = [{ nome: 'Milho', valor: 400, detalhe?: '3 plantios' }]
// Nome à esquerda, barra fina (14px) com ponta arredondada, valor na ponta.
// Aceita valores negativos (ex.: prejuízo): a barra vai para a esquerda do zero.
// =============================================================
import { useState } from 'react';
import { COR, compacto, escala } from '../../utils/graficos';
import TabelaDoGrafico from './TabelaDoGrafico';
import useLargura from './useLargura';

const LINHA = 34; // altura de cada linha
const BARRA = 14; // espessura da barra
const ROTULO = 118; // coluna dos nomes
const VALOR = 74; // espaço para o número na ponta
const EIXO = 20; // marcas embaixo

/** Barra com a ponta (lado do valor) arredondada e a base (lado do zero) reta. */
function caminhoBarra(x0, x1, y, altura) {
  const r = Math.min(4, Math.abs(x1 - x0) / 2, altura / 2);
  if (Math.abs(x1 - x0) < 0.5) return '';
  if (x1 > x0) {
    return `M${x0},${y}H${x1 - r}Q${x1},${y} ${x1},${y + r}V${y + altura - r}Q${x1},${y + altura} ${x1 - r},${y + altura}H${x0}Z`;
  }
  return `M${x0},${y}H${x1 + r}Q${x1},${y} ${x1},${y + r}V${y + altura - r}Q${x1},${y + altura} ${x1 + r},${y + altura}H${x0}Z`;
}

const encurtar = (texto, max = 14) => (texto.length > max ? `${texto.slice(0, max - 1)}…` : texto);

export default function GraficoBarrasH({
  titulo,
  itens,
  formatar,
  formatarEixo = compacto,
  cor = COR.principal,
  corNegativa = '#a8325f',
  nomeValor = 'Valor',
}) {
  const [ref, largura] = useLargura();
  const [ativo, setAtivo] = useState(null);

  if (!itens.length) return <p className="grafico-painel__vazio grafico-painel__vazio--solto">Sem dados para mostrar.</p>;

  const maximo = Math.max(...itens.map((i) => i.valor), 0);
  const minimo = Math.min(...itens.map((i) => i.valor), 0);
  const { max, ticks } = escala(Math.max(maximo, -minimo) || 1, 2);
  const passo = ticks[1] - ticks[0];
  const min = minimo < 0 ? -passo * Math.ceil(-minimo / passo) : 0;
  const marcas = [];
  for (let t = min; t <= (maximo > 0 ? max : 0) + passo / 2; t += passo) marcas.push(Math.round(t * 1000) / 1000);
  const topoEscala = Math.max(marcas[marcas.length - 1], 0) || passo;

  const xInicio = ROTULO;
  const xFim = largura - VALOR;
  const x = (v) => xInicio + ((v - min) / (topoEscala - min)) * (xFim - xInicio);
  const altura = itens.length * LINHA + EIXO;

  return (
    <div className="grafico-painel">
      <div ref={ref} className="grafico-painel__area">
        <svg width={largura} height={altura} role="img" aria-label={`${titulo}. Use "Ver em tabela" para ler os valores.`} onPointerLeave={() => setAtivo(null)}>
          {/* Grade vertical discreta */}
          {marcas.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={0} y2={itens.length * LINHA} stroke={t === 0 ? COR.eixo : COR.grade} strokeWidth="1" />
              <text x={x(t)} y={altura - 4} textAnchor="middle" className="grafico-painel__eixo">
                {formatarEixo(t)}
              </text>
            </g>
          ))}

          {itens.map((item, i) => {
            const y = i * LINHA + (LINHA - BARRA) / 2;
            const negativo = item.valor < 0;
            const x0 = x(0);
            const x1 = x(item.valor);
            return (
              <g key={item.nome}>
                {ativo === i && <rect x={0} y={i * LINHA} width={largura} height={LINHA} fill={COR.grade} opacity="0.4" rx="4" />}
                <text x={0} y={i * LINHA + LINHA / 2} dy="0.32em" className="grafico-painel__nome">
                  <title>{item.nome}</title>
                  {encurtar(item.nome)}
                </text>
                <path d={caminhoBarra(x0, Math.abs(x1 - x0) < 3 && item.valor !== 0 ? x0 + (negativo ? -3 : 3) : x1, y, BARRA)} fill={negativo ? corNegativa : cor} />
                <text
                  x={negativo ? x0 + 6 : Math.max(x1, x0) + 6}
                  y={i * LINHA + LINHA / 2}
                  dy="0.32em"
                  className="grafico-painel__valor"
                >
                  {formatar(item.valor)}
                </text>
                <rect
                  x={0}
                  y={i * LINHA}
                  width={largura}
                  height={LINHA}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${item.nome}: ${formatar(item.valor)}${item.detalhe ? `, ${item.detalhe}` : ''}`}
                  onPointerEnter={() => setAtivo(i)}
                  onFocus={() => setAtivo(i)}
                  onBlur={() => setAtivo(null)}
                />
              </g>
            );
          })}
        </svg>

        {ativo !== null && itens[ativo].detalhe && (
          <div className="grafico-painel__dica" style={{ left: largura / 2, top: ativo * LINHA - 4 }} role="status">
            <p className="grafico-painel__dica-titulo">{itens[ativo].nome}</p>
            <p className="grafico-painel__dica-linha">
              <strong>{formatar(itens[ativo].valor)}</strong>
              <span>{itens[ativo].detalhe}</span>
            </p>
          </div>
        )}
      </div>

      <TabelaDoGrafico
        cabecalhos={['Item', nomeValor, ...(itens.some((i) => i.detalhe) ? ['Detalhe'] : [])]}
        linhas={itens.map((i) => [i.nome, formatar(i.valor), ...(itens.some((it) => it.detalhe) ? [i.detalhe || '—'] : [])])}
      />
    </div>
  );
}
