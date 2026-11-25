// Mini-tendência dos cartões de indicador: linha cinza-esverdeada,
// com o mês atual (último ponto) destacado na cor principal.
import { COR } from '../../utils/graficos';
import useLargura from './useLargura';

export default function Sparkline({ valores, altura = 28 }) {
  const [ref, largura] = useLargura(120);
  const n = valores.length;
  const max = Math.max(...valores, 0);
  const min = Math.min(...valores, 0);
  const faixa = max - min || 1;
  const x = (i) => 3 + (n === 1 ? 0 : (i / (n - 1)) * (largura - 6));
  const y = (v) => 3 + (altura - 6) - ((v - min) / faixa) * (altura - 6);
  const linha = valores.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('');

  return (
    <div ref={ref} className="sparkline" aria-hidden="true">
      {n > 1 && (
        <svg width={largura} height={altura}>
          <path d={linha} fill="none" stroke={COR.apagada} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(n - 1)} cy={y(valores[n - 1])} r="3" fill={COR.principal} />
        </svg>
      )}
    </div>
  );
}
