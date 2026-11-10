// =============================================================
// pages/Dashboard.jsx — Tela 06: Dashboard da comunidade (RF08/RF09).
// Mostra: área total plantada, agricultoras ativas e a distribuição
// de espécies em gráfico de barras.
//
// A agricultora alterna entre "Comunidade" e "Meus plantios".
// O botão "Baixar gráfico" gera uma imagem PNG do que está na tela.
// =============================================================
import { useEffect, useState } from 'react';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import GraficoBarras, { CORES } from '../components/GraficoBarras';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { carregarPainel, resumirPlantios } from '../services/dashboardService';
import { listarPlantios } from '../services/plantioService';
import { baixarGraficoPng } from '../utils/exportarGrafico';
import { formatarArea } from '../utils/formatadores';

export default function Dashboard() {
  const { usuario } = useAuth();
  const ehAgricultora = usuario?.tipo === 'AGRICULTORA';

  // 'comunidade' ou 'meus' (só a agricultora escolhe)
  const [visao, setVisao] = useState('comunidade');
  const [painel, setPainel] = useState(null); // { origem, dados }
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [erroExportar, setErroExportar] = useState('');

  // Carrega os números sempre que muda a visão
  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');

    const busca =
      visao === 'meus'
        ? listarPlantios().then((lista) => ({ origem: 'pessoal', dados: resumirPlantios(lista) }))
        : carregarPainel(usuario?.tipo);

    busca
      .then((resultado) => ativo && setPainel(resultado))
      .catch((e) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [visao, usuario?.tipo]);

  const dados = painel?.dados;
  const pessoal = painel?.origem === 'pessoal';
  const nomeComunidade = dados?.comunidade?.nome;

  // Indicadores mostrados (os mesmos vão para a imagem exportada)
  const indicadores = dados
    ? [
        { valor: formatarArea(dados.areaTotal), rotulo: 'área total plantada' },
        pessoal
          ? {
              valor: String(dados.especies.length),
              rotulo: dados.especies.length === 1 ? 'espécie cultivada' : 'espécies cultivadas',
            }
          : { valor: String(dados.agricultorasAtivas), rotulo: 'agricultoras ativas' },
      ]
    : [];

  async function aoExportar() {
    setExportando(true);
    setErroExportar('');
    try {
      await baixarGraficoPng({
        titulo: 'Distribuição de espécies',
        subtitulo: pessoal
          ? `Plantios de ${usuario?.nome || 'agricultora'}`
          : nomeComunidade || 'Comunidade',
        totais: indicadores,
        itens: dados.especies,
        cores: CORES,
      });
    } catch (e) {
      setErroExportar(e.message || 'Não foi possível gerar a imagem.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <Layout>
      <div>
        {nomeComunidade && !pessoal && <p className="sobretitulo">{nomeComunidade}</p>}
        <h1 className="titulo">Comunidade</h1>
      </div>

      {/* Escolha da visão (só agricultora) */}
      {ehAgricultora && (
        <div className="alternador" role="group" aria-label="Ver números de">
          {[
            { valor: 'comunidade', rotulo: 'Comunidade' },
            { valor: 'meus', rotulo: 'Meus plantios' },
          ].map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={`alternador__opcao ${visao === opcao.valor ? 'alternador__opcao--ativa' : ''}`}
              aria-pressed={visao === opcao.valor}
              onClick={() => setVisao(opcao.valor)}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      )}

      {carregando && <Carregando texto="Somando os plantios..." />}
      <Aviso tipo="erro">{erro}</Aviso>

      {!carregando && painel?.origem === 'indisponivel' && (
        <Aviso tipo="info">
          O painel da comunidade ainda está sendo preparado. Volte em breve!
        </Aviso>
      )}

      {!carregando && dados && (
        <>
          {/* Aviso quando a rota da comunidade não respondeu e caiu nos números pessoais */}
          {pessoal && visao === 'comunidade' && (
            <Aviso tipo="info">
              O painel da comunidade não respondeu. Por enquanto, veja os números dos seus plantios.
            </Aviso>
          )}

          {/* Cartões de indicadores (RF08) */}
          <div className="indicadores">
            {indicadores.map((item) => (
              <div className="indicador" key={item.rotulo}>
                <strong>{item.valor}</strong>
                <span>{item.rotulo}</span>
              </div>
            ))}
          </div>

          {/* Gráfico (RF09) + exportar */}
          <section className="cartao">
            <h2 className="subtitulo">Distribuição de espécies</h2>
            <GraficoBarras itens={dados.especies} />
            {dados.especies.length > 0 && (
              <>
                <button
                  type="button"
                  className="botao botao--secundario grafico__exportar"
                  onClick={aoExportar}
                  disabled={exportando}
                >
                  <Icone nome="baixar" tamanho={20} />
                  {exportando ? 'Gerando imagem...' : 'Baixar gráfico (imagem)'}
                </button>
                <Aviso tipo="erro">{erroExportar}</Aviso>
              </>
            )}
          </section>
        </>
      )}
    </Layout>
  );
}
