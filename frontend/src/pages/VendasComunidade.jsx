// =============================================================
// pages/VendasComunidade.jsx — Vendas da comunidade (responsável).
//   /coordenadora/vendas
//
// Só TOTAIS: quanto a comunidade vendeu e gastou, o preço médio do kg
// em cada lugar de venda e a margem por espécie. O dinheiro de cada
// agricultora fica visível só para ela (a API nem manda).
// =============================================================
import { useEffect, useState } from 'react';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import Layout from '../components/Layout';
import SeletorAno, { anoAtual, periodoDoAno } from '../components/SeletorAno';
import { buscarResumoDaComunidade } from '../services/financasService';
import { formatarMargem, formatarReais, formatarReaisCurto, rotuloCanal } from '../utils/dinheiro';
import { formatarKg } from '../utils/estoque';

/** Frase comparando o melhor e o pior preço do kg entre os lugares de venda. */
function conclusaoDosCanais(canais) {
  if (canais.length < 2) return '';
  const melhor = canais[0];
  const pior = canais[canais.length - 1];
  if (!pior.precoMedioKg || melhor.precoMedioKg / pior.precoMedioKg < 1.3) return '';
  const proporcao = pior.precoMedioKg / melhor.precoMedioKg;
  const quanto = proporcao <= 0.6 ? 'quase a metade' : `${Math.round(proporcao * 100)}%`;
  return `Em "${rotuloCanal(pior.canal)}" o kg sai por ${quanto} do preço em "${rotuloCanal(melhor.canal)}". Vender junto onde paga melhor pode valer a pena.`;
}

export default function VendasComunidade() {
  const [ano, setAno] = useState(anoAtual());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');
    buscarResumoDaComunidade(periodoDoAno(ano))
      .then((d) => ativo && setDados(d))
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [ano]);

  const total = dados?.total;
  const semMovimento = dados && !total.receita && !total.gastos;
  const maiorPreco = Math.max(...(dados?.canais || []).map((c) => c.precoMedioKg), 0);
  const frase = dados ? conclusaoDosCanais(dados.canais) : '';

  return (
    <Layout cabecalho={{ voltarPara: '/coordenadora', rotuloVoltar: 'Início' }}>
      <div>
        <h1 className="titulo">Vendas da comunidade</h1>
        {dados && (
          <p className="texto-apoio">
            {dados.comunidade.nome} · {dados.agricultorasComVendas} de {dados.totalAgricultoras}{' '}
            {dados.totalAgricultoras === 1 ? 'agricultora anotou' : 'agricultoras anotaram'} vendas
          </p>
        )}
      </div>

      <SeletorAno valor={ano} aoMudar={setAno} />
      <Aviso tipo="erro">{erro}</Aviso>

      {carregando ? (
        <Carregando texto="Somando as vendas..." />
      ) : semMovimento ? (
        <section className="cartao">
          <p className="texto-apoio">
            Nenhuma venda ou gasto anotado {ano === 'tudo' ? 'ainda' : `em ${ano}`}. As agricultoras
            anotam na aba <strong>Dinheiro</strong> de cada plantio.
          </p>
        </section>
      ) : (
        dados && (
          <>
            <div className="numeros">
              <div className="numero">
                <span className="numero__rotulo">Vendido</span>
                <strong className="numero__valor">{formatarReaisCurto(total.receita)}</strong>
              </div>
              <div className="numero">
                <span className="numero__rotulo">Gasto</span>
                <strong className="numero__valor">{formatarReaisCurto(total.gastos)}</strong>
              </div>
              <div className="numero numero--positivo">
                <span className="numero__rotulo">{total.lucro >= 0 ? 'Sobrou' : 'Faltou'}</span>
                <strong className="numero__valor">{formatarReaisCurto(Math.abs(total.lucro))}</strong>
              </div>
              <div className="numero numero--positivo">
                <span className="numero__rotulo">Margem média</span>
                <strong className="numero__valor">{formatarMargem(total.margem)}</strong>
              </div>
            </div>

            {dados.canais.length > 0 && (
              <section className="cartao">
                <h2 className="subtitulo">Preço médio do kg, por onde vendeu</h2>
                <ul className="barras">
                  {dados.canais.map((c) => (
                    <li key={c.canal} className="barras__item">
                      <div className="barras__rotulos">
                        <span>
                          {rotuloCanal(c.canal)}
                          <span className="barras__nota"> · {formatarKg(c.kgVendidos)}</span>
                        </span>
                        <strong>{formatarReais(c.precoMedioKg)}</strong>
                      </div>
                      <div className="grafico__trilho">
                        <div
                          className="grafico__barra barras__barra"
                          style={{ width: `${(c.precoMedioKg / maiorPreco) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                {frase && <p className="financas__destaque">{frase}</p>}
              </section>
            )}

            {dados.especies.length > 0 && (
              <section className="cartao">
                <h2 className="subtitulo">Por espécie</h2>
                <div className="tabela-envoltorio">
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th scope="col">Espécie</th>
                        <th scope="col" className="tabela__numero">Vendido</th>
                        <th scope="col" className="tabela__numero">Margem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.especies.map((e) => (
                        <tr key={e.especie}>
                          <th scope="row">{e.especie}</th>
                          <td className="tabela__numero">{formatarReaisCurto(e.receita)}</td>
                          <td className="tabela__numero">{formatarMargem(e.margem)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )
      )}

      <p className="texto-apoio">
        Você vê só os totais da comunidade. O dinheiro de cada agricultora fica visível só para ela.
      </p>
    </Layout>
  );
}
