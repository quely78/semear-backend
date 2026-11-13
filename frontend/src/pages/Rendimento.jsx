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
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import SeletorAno, { anoAtual, periodoDoAno } from '../components/SeletorAno';
import { buscarResumoDaAgricultora } from '../services/financasService';
import { formatarMargem, formatarReais } from '../utils/dinheiro';
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
  const maiorLucroM2 = Math.max(...linhas.map((l) => l.lucroPorM2), 0);
  const frase = conclusao(linhas);

  return (
    <Layout cabecalho={{ voltarPara: '/plantios', rotuloVoltar: 'Meus plantios' }}>
      <div>
        <h1 className="titulo">Qual plantio rende mais?</h1>
        <p className="texto-apoio">Quanto sobrou em cada m² plantado</p>
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
          <section className="cartao">
            <h2 className="subtitulo">Lucro por m²</h2>
            <ul className="barras">
              {linhas.map((l) => (
                <li key={l.especie} className="barras__item">
                  <div className="barras__rotulos">
                    <span>{l.especie}</span>
                    <strong className={l.lucroPorM2 < 0 ? 'financas__negativo' : ''}>
                      {formatarReais(l.lucroPorM2)}/m²
                    </strong>
                  </div>
                  <div className="grafico__trilho">
                    <div
                      className="grafico__barra barras__barra"
                      style={{ width: maiorLucroM2 > 0 ? `${Math.max((l.lucroPorM2 / maiorLucroM2) * 100, 0)}%` : 0 }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {frase && <p className="financas__destaque">{frase}</p>}

          <section className="cartao">
            <h2 className="subtitulo">Detalhe de cada espécie</h2>
            <div className="tabela-envoltorio">
              <table className="tabela">
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
