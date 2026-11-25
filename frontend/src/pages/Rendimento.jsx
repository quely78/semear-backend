// =============================================================
// pages/Rendimento.jsx — "Qual plantio rende mais?"
//   /plantios/rendimento
//
// Compara as espécies da agricultora pelo LUCRO POR m²
// (quanto sobrou em cada metro quadrado plantado), no ano escolhido.
// Plantios da mesma espécie são somados.
// =============================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import CartaoGrafico from '../components/graficos/CartaoGrafico';
import GraficoBarrasH from '../components/graficos/GraficoBarrasH';
import Indicador from '../components/graficos/Indicador';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import SeletorAno, { anoAtual, periodoDoAno } from '../components/SeletorAno';
import { buscarResumoDaAgricultora } from '../services/financasService';
import { formatarMargem, formatarReais } from '../utils/dinheiro';
import { formatarKg } from '../utils/estoque';
import { formatarArea } from '../utils/formatadores';

/** Plantios → uma linha por espécie, da que mais rende por m² para a que menos rende. */
function porEspecie(plantios) {
  const linhas = {};
  plantios.forEach(({ especie, area, resumo }) => {
    const linha = (linhas[especie] ||= { especie, area: 0, receita: 0, gastos: 0, lucro: 0 });
    linha.area += area;
    linha.receita += resumo.receita;
    linha.gastos += resumo.gastos;
    linha.lucro += resumo.lucro;
  });
  return Object.values(linhas)
    .map((l) => ({
      ...l,
      lucroPorM2: l.area > 0 ? l.lucro / l.area : 0,
      margem: l.receita > 0 ? l.lucro / l.receita : null,
    }))
    .sort((a, b) => b.lucroPorM2 - a.lucroPorM2);
}

/** Frase de conclusão: quantas vezes a melhor rende mais que a pior. */
function conclusao(linhas) {
  if (linhas.length < 2) return '';
  const melhor = linhas[0];
  const pior = linhas[linhas.length - 1];
  if (melhor.lucroPorM2 <= 0) return '';
  if (pior.lucroPorM2 <= 0) {
    return `${melhor.especie} foi a que mais rendeu por m². ${pior.especie} não deu lucro neste período.`;
  }
  const vezes = melhor.lucroPorM2 / pior.lucroPorM2;
  if (vezes < 1.5) return 'Suas espécies renderam parecido por m² neste período.';
  return `Cada m² de ${melhor.especie.toLowerCase()} rendeu ${Math.round(vezes)} vezes mais que um m² de ${pior.especie.toLowerCase()}. Vale pensar nisso na próxima safra.`;
}

export default function Rendimento() {
  const [ano, setAno] = useState(anoAtual());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');
    buscarResumoDaAgricultora(periodoDoAno(ano))
      .then((d) => ativo && setDados(d))
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [ano]);

  const linhas = dados ? porEspecie(dados.plantios) : [];
  const frase = conclusao(linhas);
  const total = dados?.total;

  return (
    <Layout cabecalho={{ voltarPara: '/plantios', rotuloVoltar: 'Meus plantios' }}>
      <div>
        <h1 className="titulo">Qual plantio rende mais?</h1>
      </div>

      <SeletorAno valor={ano} aoMudar={setAno} />
      <Aviso tipo="erro">{erro}</Aviso>

      {carregando ? (
        <Carregando texto="Fazendo as contas..." />
      ) : linhas.length === 0 ? (
        <section className="cartao">
          <p className="texto-apoio">
            Nenhum gasto ou venda anotado {ano === 'tudo' ? 'ainda' : `em ${ano}`}. Abra um plantio,
            toque na aba <strong>Dinheiro</strong> e anote o que gastou e o que vendeu.
          </p>
        </section>
      ) : (
        <>
          <div className="painel-indicadores">
            <Indicador rotulo="Vendido" valor={formatarReais(total.receita)} detalhe={`${formatarKg(total.kgVendidos)} vendidos`} />
            <Indicador rotulo="Gasto" valor={formatarReais(total.gastos)} detalhe={`em ${dados.plantios.length} ${dados.plantios.length === 1 ? 'plantio' : 'plantios'}`} />
            <Indicador
              rotulo={total.lucro >= 0 ? 'Sobrou' : 'Faltou'}
              valor={formatarReais(Math.abs(total.lucro))}
              alerta={total.lucro < 0}
              detalhe="vendido − gasto"
            />
            <Indicador rotulo="Margem média" valor={formatarMargem(total.margem)} detalhe={total.precoMedioKg ? `preço médio ${formatarReais(total.precoMedioKg)}/kg` : 'sem vendas'} />
          </div>

          <CartaoGrafico titulo="Lucro por m²" sub="quanto sobrou em cada m² plantado · abaixo de zero = prejuízo" exportavel>
            <GraficoBarrasH
              titulo="Lucro por metro quadrado, por espécie"
              itens={linhas.map((l) => ({
                nome: l.especie,
                valor: Math.round(l.lucroPorM2 * 100) / 100,
                detalhe: `${formatarReais(l.lucro)} em ${formatarArea(l.area)}`,
              }))}
              formatar={(v) => `${formatarReais(v)}/m²`}
              formatarEixo={(v) => `R$ ${v.toLocaleString('pt-BR')}`}
              nomeValor="Lucro por m²"
            />
          </CartaoGrafico>

          {frase && <p className="financas__destaque">{frase}</p>}

          <section className="cartao painel-cartao">
            <h2 className="painel-cartao__titulo">Detalhe de cada espécie</h2>
            <div className="tabela-envoltorio">
              <table className="tabela tabela--compacta">
                <thead>
                  <tr>
                    <th scope="col">Espécie</th>
                    <th scope="col" className="tabela__numero">Sobrou</th>
                    <th scope="col" className="tabela__numero">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.especie}>
                      <th scope="row">
                        {l.especie}
                        <span className="financas__sub">{formatarArea(l.area)}</span>
                      </th>
                      <td className={`tabela__numero ${l.lucro < 0 ? 'financas__negativo' : ''}`}>{formatarReais(l.lucro)}</td>
                      <td className="tabela__numero">{formatarMargem(l.margem)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <Link to="/plantios/relatorio" className="botao botao--secundario">
            <Icone nome="baixar" tamanho={18} /> Relatório para o banco (Pronaf)
          </Link>
        </>
      )}
    </Layout>
  );
}
