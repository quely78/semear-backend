// =============================================================
// pages/Dashboard.jsx — Tela 06: Dashboard da comunidade (RF08/RF09).
// Mostra: área total plantada, agricultoras ativas e a distribuição
// de espécies em gráfico de barras.
// =============================================================
import { useEffect, useState } from 'react';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import GraficoBarras from '../components/GraficoBarras';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { carregarPainel } from '../services/dashboardService';
import { formatarArea } from '../utils/formatadores';

export default function Dashboard() {
  const { usuario } = useAuth();
  const [painel, setPainel] = useState(null); // { origem, dados }
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Carrega os indicadores ao abrir a tela
  useEffect(() => {
    carregarPainel(usuario?.tipo)
      .then(setPainel)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [usuario?.tipo]);

  const dados = painel?.dados;
  const pessoal = painel?.origem === 'pessoal';

  return (
    <Layout cabecalho={{ titulo: 'Comunidade' }}>
      <h1 className="titulo">{pessoal ? 'Meus números' : 'Nossa comunidade'}</h1>

      {carregando && <Carregando texto="Somando os plantios..." />}
      <Aviso tipo="erro">{erro}</Aviso>

      {/* Sem rota do painel e sem plantios próprios (ex.: coordenadora) */}
      {painel?.origem === 'indisponivel' && (
        <Aviso tipo="info">
          O painel da comunidade ainda está sendo preparado. Volte em breve!
        </Aviso>
      )}

      {dados && (
        <>
          {/* Aviso enquanto a rota /dashboard/comunidade não existir */}
          {pessoal && (
            <Aviso tipo="info">
              O painel da comunidade estará disponível em breve. Por enquanto, veja os números dos
              seus plantios.
            </Aviso>
          )}

          {/* Cartões de indicadores (RF08) */}
          <div className="indicadores">
            <div className="indicador">
              <strong>{formatarArea(dados.areaTotal)}</strong>
              <span>área total plantada</span>
            </div>
            <div className="indicador indicador--rosa">
              {pessoal ? (
                <>
                  <strong>{dados.especies.length}</strong>
                  <span>{dados.especies.length === 1 ? 'espécie cultivada' : 'espécies cultivadas'}</span>
                </>
              ) : (
                <>
                  <strong>{dados.agricultorasAtivas}</strong>
                  <span>agricultoras ativas</span>
                </>
              )}
            </div>
          </div>

          {/* Gráfico (RF09) */}
          <section className="cartao">
            <h2 className="subtitulo">Distribuição de espécies</h2>
            <GraficoBarras itens={dados.especies} />
          </section>
        </>
      )}
    </Layout>
  );
}