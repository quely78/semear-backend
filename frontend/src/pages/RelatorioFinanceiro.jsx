// =============================================================
// pages/RelatorioFinanceiro.jsx — Relatório de produção e vendas.
//   /plantios/relatorio
//
// Um documento simples para pedir crédito rural (Pronaf) ou mostrar
// ao banco: vendas e gastos por espécie no período escolhido.
// "Baixar PDF" abre a impressão do celular/computador
// (lá ela escolhe "Salvar como PDF"); só o documento é impresso.
// =============================================================
import { useEffect, useState } from 'react';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { buscarResumoDaAgricultora } from '../services/financasService';
import { obterPerfil } from '../services/perfilService';
import { hoje as calcularHoje } from '../utils/datas';
import { formatarMargem, formatarReais } from '../utils/dinheiro';
import { formatarArea, formatarData } from '../utils/formatadores';

/** Plantios → linhas por espécie (somando plantios da mesma espécie). */
function linhasPorEspecie(plantios) {
  const linhas = {};
  plantios.forEach(({ especie, area, resumo }) => {
    const linha = (linhas[especie] ||= { especie, area: 0, receita: 0, gastos: 0 });
    linha.area += area;
    linha.receita += resumo.receita;
    linha.gastos += resumo.gastos;
  });
  return Object.values(linhas).sort((a, b) => b.receita - a.receita);
}

export default function RelatorioFinanceiro() {
  const { usuario } = useAuth();
  const hoje = calcularHoje();
  const [periodo, setPeriodo] = useState({ dataInicio: `${hoje.slice(0, 4)}-01-01`, dataFim: hoje });
  const [dados, setDados] = useState(null);
  const [comunidade, setComunidade] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Nome da comunidade para o cabeçalho do documento
  useEffect(() => {
    obterPerfil()
      .then((perfil) => setComunidade(perfil.comunidade?.nome || ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!periodo.dataInicio || !periodo.dataFim || periodo.dataInicio > periodo.dataFim) return undefined;
    let ativo = true;
    setCarregando(true);
    setErro('');
    buscarResumoDaAgricultora(periodo)
      .then((d) => ativo && setDados(d))
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [periodo]);

  const periodoInvalido = periodo.dataInicio && periodo.dataFim && periodo.dataInicio > periodo.dataFim;
  const linhas = dados ? linhasPorEspecie(dados.plantios) : [];
  const areaTotal = linhas.reduce((soma, l) => soma + l.area, 0);

  function aoMudarData(evento) {
    const { name, value } = evento.target;
    setPeriodo((atual) => ({ ...atual, [name]: value }));
  }

  return (
    <Layout cabecalho={{ voltarPara: '/plantios/rendimento', rotuloVoltar: 'Qual plantio rende mais' }}>
      <div className="nao-imprimir">
        <h1 className="titulo">Relatório de vendas</h1>
        <p className="texto-apoio">Para pedir crédito (Pronaf) ou mostrar ao banco</p>
      </div>

      <div className="financas__campos nao-imprimir">
        <Campo id="dataInicio" rotulo="De">
          <input id="dataInicio" name="dataInicio" type="date" max={hoje} value={periodo.dataInicio} onChange={aoMudarData} />
        </Campo>
        <Campo id="dataFim" rotulo="Até" erro={periodoInvalido ? 'Precisa ser depois do "De".' : ''}>
          <input id="dataFim" name="dataFim" type="date" max={hoje} value={periodo.dataFim} onChange={aoMudarData} />
        </Campo>
      </div>

      <Aviso tipo="erro">{erro}</Aviso>

      {carregando ? (
        <Carregando texto="Montando o relatório..." />
      ) : (
        dados && (
          <>
            <p className="campo__rotulo nao-imprimir">Prévia do documento</p>
            <article className="relatorio" aria-label="Relatório de produção e vendas">
              <header className="relatorio__topo">
                <div>
                  <p className="relatorio__marca">SemeAR</p>
                  <p className="relatorio__subtitulo">Relatório de produção e vendas</p>
                </div>
                <p className="relatorio__periodo">
                  {formatarData(dados.periodo.dataInicio)} a {formatarData(dados.periodo.dataFim)}
                </p>
              </header>

              <dl className="relatorio__dados">
                <div><dt>Agricultora:</dt><dd>{usuario?.nome}</dd></div>
                {comunidade && <div><dt>Comunidade:</dt><dd>{comunidade} — Rio Preto da Eva/AM</dd></div>}
                <div>
                  <dt>Área plantada:</dt>
                  <dd>
                    {formatarArea(areaTotal)} · {dados.plantios.length}{' '}
                    {dados.plantios.length === 1 ? 'plantio' : 'plantios'}
                  </dd>
                </div>
              </dl>

              {linhas.length === 0 ? (
                <p className="relatorio__vazio">Nenhum gasto ou venda anotado neste período.</p>
              ) : (
                <table className="relatorio__tabela">
                  <thead>
                    <tr>
                      <th scope="col">Espécie</th>
                      <th scope="col">Vendas</th>
                      <th scope="col">Gastos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr key={l.especie}>
                        <th scope="row">{l.especie}</th>
                        <td>{formatarReais(l.receita)}</td>
                        <td>{formatarReais(l.gastos)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row">Total</th>
                      <td>{formatarReais(dados.total.receita)}</td>
                      <td>{formatarReais(dados.total.gastos)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              <div className="relatorio__resultado">
                <span><strong>Resultado:</strong> {formatarReais(dados.total.lucro)}</span>
                <span><strong>Margem:</strong> {formatarMargem(dados.total.margem)}</span>
              </div>
              <p className="relatorio__rodape">
                Valores informados pela própria agricultora no SemeAR. Gerado em {formatarData(hoje)}.
              </p>
            </article>

            <button type="button" className="botao botao--primario nao-imprimir" onClick={() => window.print()}>
              <Icone nome="baixar" tamanho={18} /> Baixar PDF
            </button>
            <p className="texto-apoio nao-imprimir">
              Na tela de impressão, escolha <strong>Salvar como PDF</strong>.
            </p>
          </>
        )
      )}
    </Layout>
  );
}
