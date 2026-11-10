// =============================================================
// pages/Coordenadora.jsx — Tela 08: Início da responsável pela comunidade.
//
// Perfil de quem CUIDA da comunidade (no banco: COORDENADORA).
// Organizado para responder, de cima para baixo:
//   1. Como está a minha comunidade?  (faixa verde + números)
//   2. O que pede atenção agora?      (prontos para colher, agricultoras sem plantio)
//   3. Para onde eu vou?              (atalhos)
//   4. O que aconteceu por último?    (últimas entradas e saídas do estoque)
// =============================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import {
  listarAgricultorasDaComunidade,
  listarPlantiosDaComunidade,
} from '../services/comunidadeService';
import { diaEMes, hoje as calcularHoje } from '../utils/datas';
import { formatarKg, janelaDeColheita, resumirEstoque, situacaoDoPlantio } from '../utils/estoque';
import { formatarArea, formatarData } from '../utils/formatadores';

// Atalhos da responsável
const ATALHOS = [
  {
    para: '/coordenadora/agricultoras',
    icone: 'comunidade',
    titulo: 'Agricultoras',
    texto: 'Quem planta e quanto',
  },
  {
    para: '/coordenadora/estoque',
    icone: 'estoque',
    titulo: 'Estoque',
    texto: 'No campo e colhido',
  },
  {
    para: '/comunidade',
    icone: 'grafico',
    titulo: 'Números',
    texto: 'Gráfico para baixar',
  },
];

export default function Coordenadora() {
  const hoje = calcularHoje();
  const [dados, setDados] = useState(null); // { comunidade, agricultoras, plantios }
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Busca agricultoras e plantios da comunidade ao mesmo tempo
  useEffect(() => {
    Promise.all([listarAgricultorasDaComunidade(), listarPlantiosDaComunidade()])
      .then(([resumo, { plantios }]) => setDados({ ...resumo, plantios }))
      .catch((e) =>
        setErro(
          e.status === 404
            ? e.message || 'Os dados da sua comunidade ainda não estão disponíveis.'
            : e.message,
        ),
      )
      .finally(() => setCarregando(false));
  }, []);

  const agricultoras = dados?.agricultoras || [];
  const plantios = dados?.plantios || [];
  const ativas = agricultoras.filter((a) => Number(a.totalPlantios) > 0).length;
  const semPlantio = agricultoras.length - ativas;
  const { totais, movimentos } = resumirEstoque(plantios, hoje);
  const noCampo = totais.crescendo + totais.pronto + totais.atrasado;
  const paraColher = plantios.filter((p) =>
    ['pronto', 'atrasado'].includes(situacaoDoPlantio(p, hoje)),
  );
  const atrasados = paraColher.filter((p) => situacaoDoPlantio(p, hoje) === 'atrasado').length;

  return (
    <Layout>
      {/* 1. Faixa de boas-vindas com o nome da comunidade */}
      <section className="painel-responsavel">
        <p className="painel-responsavel__papel">Responsável pela comunidade</p>
        <h1 className="painel-responsavel__nome">
          {dados?.comunidade?.nome || 'Minha comunidade'}
        </h1>
        {dados && (
          <p className="painel-responsavel__resumo">
            {agricultoras.length} {agricultoras.length === 1 ? 'agricultora' : 'agricultoras'} ·{' '}
            {ativas} com plantio
          </p>
        )}
      </section>

      {carregando && <Carregando texto="Carregando sua comunidade..." />}
      <Aviso tipo="erro">{erro}</Aviso>

      {dados && (
        <>
          {/* Números principais */}
          <div className="numeros">
            <div className="numero">
              <span className="numero__rotulo">No campo</span>
              <strong className="numero__valor">{formatarArea(noCampo)}</strong>
            </div>
            <div className="numero numero--destaque">
              <span className="numero__rotulo">Pronto para colher</span>
              <strong className="numero__valor">
                {formatarArea(totais.pronto + totais.atrasado)}
              </strong>
            </div>
            <div className="numero">
              <span className="numero__rotulo">Já colhido</span>
              <strong className="numero__valor">{formatarKg(totais.colhidoKg)}</strong>
            </div>
            <div className="numero">
              <span className="numero__rotulo">Plantios</span>
              <strong className="numero__valor">{plantios.length}</strong>
            </div>
          </div>

          {/* 2. O que pede atenção */}
          {(paraColher.length > 0 || semPlantio > 0) && (
            <section className="atencao" aria-label="Precisa de atenção">
              <h2 className="subtitulo">Precisa de atenção</h2>
              <ul className="atencao__lista">
                {paraColher.length > 0 && (
                  <li>
                    <Link to="/coordenadora/estoque" className="atencao__item">
                      <span className="atencao__icone atencao__icone--colheita" aria-hidden="true">
                        <Icone nome="cesta" tamanho={22} />
                      </span>
                      <span>
                        <strong>
                          {paraColher.length}{' '}
                          {paraColher.length === 1 ? 'plantio pronto' : 'plantios prontos'} para
                          colher
                        </strong>
                        <span className="atencao__detalhe">
                          {atrasados > 0
                            ? `${atrasados} já ${atrasados === 1 ? 'passou' : 'passaram'} da época`
                            : paraColher
                                .slice(0, 2)
                                .map((p) => `${p.especie} (${p.agricultora?.nome?.split(' ')[0]}) até ${diaEMes(janelaDeColheita(p).fim)}`)
                                .join(' · ')}
                        </span>
                      </span>
                      <Icone nome="avancar" tamanho={18} />
                    </Link>
                  </li>
                )}
                {semPlantio > 0 && (
                  <li>
                    <Link to="/coordenadora/agricultoras" className="atencao__item">
                      <span className="atencao__icone" aria-hidden="true">
                        <Icone nome="comunidade" tamanho={22} />
                      </span>
                      <span>
                        <strong>
                          {semPlantio} {semPlantio === 1 ? 'agricultora' : 'agricultoras'} sem
                          plantio
                        </strong>
                        <span className="atencao__detalhe">Vale conversar e ajudar no registro</span>
                      </span>
                      <Icone nome="avancar" tamanho={18} />
                    </Link>
                  </li>
                )}
              </ul>
            </section>
          )}
        </>
      )}

      {/* 3. Atalhos */}
      <nav className="atalhos" aria-label="Atalhos">
        {ATALHOS.map((atalho) => (
          <Link key={atalho.para} to={atalho.para} className="atalho">
            <span className="atalho__icone" aria-hidden="true">
              <Icone nome={atalho.icone} tamanho={24} />
            </span>
            <strong className="atalho__titulo">{atalho.titulo}</strong>
            <span className="atalho__texto">{atalho.texto}</span>
          </Link>
        ))}
      </nav>

      {/* 4. Últimas movimentações */}
      {movimentos.length > 0 && (
        <section className="cartao">
          <h2 className="subtitulo">Últimas movimentações</h2>
          <ul className="movimentos">
            {movimentos.slice(0, 4).map(({ tipo, data, plantio }) => (
              <li key={`${tipo}-${plantio.id}`} className={`movimento movimento--${tipo}`}>
                <span className="movimento__icone" aria-hidden="true">
                  <Icone nome={tipo} tamanho={18} />
                </span>
                <div>
                  <p className="movimento__titulo">
                    {plantio.agricultora?.nome?.split(' ')[0]}{' '}
                    {tipo === 'entrada'
                      ? `plantou ${plantio.especie} · ${formatarArea(plantio.area)}`
                      : `colheu ${plantio.especie} · ${formatarKg(plantio.quantidadeColhida)}`}
                  </p>
                  <p className="movimento__detalhe">{formatarData(data)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/coordenadora/estoque" className="botao-texto">
            Ver todas no estoque
          </Link>
        </section>
      )}
    </Layout>
  );
}
