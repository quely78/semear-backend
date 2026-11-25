// =============================================================
// components/graficos/CartaoGrafico.jsx — Moldura de um gráfico do painel:
// título, linha de unidade/período e o botão "PNG" (baixa só este gráfico).
//   <CartaoGrafico titulo="Entradas e saídas" sub="kg por mês · 2026" exportavel>
//     <GraficoColunas ... />
//   </CartaoGrafico>
// =============================================================
import { useRef, useState } from 'react';
import { baixarGraficoDoCartao } from '../../utils/exportarPainel';
import Icone from '../Icone';

export default function CartaoGrafico({ titulo, sub, exportavel = false, children }) {
  const ref = useRef(null);
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState('');

  async function aoBaixar() {
    setBaixando(true);
    setErro('');
    try {
      await baixarGraficoDoCartao(ref.current, { titulo, subtitulo: sub });
    } catch (e) {
      setErro(e.message || 'Não foi possível gerar a imagem.');
    } finally {
      setBaixando(false);
    }
  }

  return (
    <section ref={ref} className="cartao painel-cartao">
      <div className="painel-cartao__topo">
        <div>
          <h2 className="painel-cartao__titulo">{titulo}</h2>
          {sub && <p className="painel-cartao__sub">{sub}</p>}
        </div>
        {exportavel && (
          <button
            type="button"
            className="painel-cartao__baixar nao-imprimir"
            onClick={aoBaixar}
            disabled={baixando}
            aria-label={`Baixar o gráfico "${titulo}" como imagem PNG`}
          >
            <Icone nome="baixar" tamanho={16} /> {baixando ? '...' : 'PNG'}
          </button>
        )}
      </div>
      {erro && <p className="campo__erro" role="alert">✕ {erro}</p>}
      {children}
    </section>
  );
}
