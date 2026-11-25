// =============================================================
// pages/CalendarioPlantio.jsx — Calendário de UM plantio.
//   /plantios/:id/calendario
//
// Mostra, mês a mês, o que vai acontecer com o plantio:
//   - etapas do ciclo da espécie (germinação, capina, colheita...),
//     contadas a partir da data do plantio (config/ciclos.js);
//   - períodos de chuva previstos para Rio Preto da Eva
//     (ex.: "10 a 17 de abril — Chuva prevista").
//
// Topo: situação no estoque e registro da colheita (saída do estoque).
// =============================================================
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import AbasPlantio from '../components/AbasPlantio';
import Aviso from '../components/Aviso';
import CalendarioMes, { periodosDoDia } from '../components/CalendarioMes';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import RegistroColheita from '../components/RegistroColheita';
import { CATEGORIAS, CICLOS, epocaDoMes } from '../config/ciclos';
import { diaParaSelecionar, montarPeriodos } from '../utils/periodosPlantio';
import { buscarPrevisaoChuva } from '../services/climaService';
import { buscarPlantio } from '../services/plantioService';
import {
  deIso,
  diaEMes,
  hoje as calcularHoje,
  nomeMes,
  partes,
  textoPeriodo,
} from '../utils/datas';
import { formatarArea, formatarData } from '../utils/formatadores';

/**
 * Mês que abre primeiro: o de hoje (se o plantio ainda está no ciclo);
 * se já foi colhido, o mês da colheita; senão, o mês do plantio.
 */
function mesInicial(plantio, periodos, hoje) {
  const doPlantio = periodos.filter((p) => p.categoria !== 'chuva');
  const inicio = doPlantio[0]?.inicio || hoje;
  const fim = doPlantio.reduce((maior, p) => (p.fim > maior ? p.fim : maior), inicio);
  const colheita = plantio.dataColheita ? deIso(plantio.dataColheita) : null;
  const referencia = hoje >= inicio && hoje <= fim ? hoje : colheita || inicio;
  const { ano, mes } = partes(referencia);
  return { ano, mes };
}

export default function CalendarioPlantio() {
  const { id } = useParams();
  const local = useLocation();
  const hoje = calcularHoje();

  // "voltar" leva para a tela de onde ela veio (Meus plantios ou a aba Calendário)
  const voltar = local.state?.voltar || { para: '/plantios', rotulo: 'Meus plantios' };
  const cabecalho = { voltarPara: voltar.para, rotuloVoltar: voltar.rotulo };

  const [plantio, setPlantio] = useState(local.state?.plantio || null);
  const [carregando, setCarregando] = useState(!local.state?.plantio);
  const [erro, setErro] = useState('');

  // Previsão do tempo (carrega em paralelo, sem travar a tela)
  const [previsao, setPrevisao] = useState(null);
  const [buscandoPrevisao, setBuscandoPrevisao] = useState(true);

  const [mesVisivel, setMesVisivel] = useState(null); // { ano, mes }
  const [selecionado, setSelecionado] = useState(null);

  // Plantio: se não veio da lista (ex.: página recarregada), busca na API
  useEffect(() => {
    if (plantio) return;
    buscarPlantio(id)
      .then((achado) => {
        if (achado) setPlantio(achado);
        else setErro('Plantio não encontrado.');
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [id, plantio]);

  useEffect(() => {
    buscarPrevisaoChuva()
      .then(setPrevisao)
      .finally(() => setBuscandoPrevisao(false));
  }, []);

  const periodos = useMemo(
    () => (plantio ? montarPeriodos([plantio], previsao) : []),
    [plantio, previsao],
  );

  // Abre no mês certo assim que o plantio chega (e escolhe um dia que está na tela)
  useEffect(() => {
    if (plantio && !mesVisivel) {
      const inicial = mesInicial(plantio, periodos, hoje);
      setMesVisivel(inicial);
      setSelecionado(diaParaSelecionar(inicial.ano, inicial.mes, periodos, hoje));
    }
  }, [plantio, periodos, mesVisivel, hoje]);

  if (carregando || (plantio && !mesVisivel)) {
    return (
      <Layout cabecalho={cabecalho}>
        <Carregando texto="Abrindo o calendário..." />
      </Layout>
    );
  }

  if (!plantio) {
    return (
      <Layout cabecalho={cabecalho}>
        <Aviso tipo="erro">{erro || 'Plantio não encontrado.'}</Aviso>
      </Layout>
    );
  }

  const temCiclo = Boolean(CICLOS[plantio.especie]);
  const { ano, mes } = mesVisivel;

  // ---------- Mês visível ----------
  const epoca = epocaDoMes(mes);
  const mesDeHoje = partes(hoje);
  const estaNoMesDeHoje = mesDeHoje.ano === ano && mesDeHoje.mes === mes;

  /** Vai para o mês anterior (-1) ou o próximo (+1). */
  function mudarMes(passo) {
    const novo = new Date(Date.UTC(ano, mes + passo, 1));
    const proximo = { ano: novo.getUTCFullYear(), mes: novo.getUTCMonth() };
    setMesVisivel(proximo);
    setSelecionado(diaParaSelecionar(proximo.ano, proximo.mes, periodos, hoje));
  }

  function irParaHoje() {
    setMesVisivel({ ano: mesDeHoje.ano, mes: mesDeHoje.mes });
    setSelecionado(hoje);
  }

  // ---------- Dia tocado ----------
  const periodosSelecionado = selecionado ? periodosDoDia(periodos, selecionado) : [];
  const chuvaDoDia = previsao?.dias.find((d) => d.data === selecionado);

  return (
    <Layout cabecalho={cabecalho}>
      <div>
        <p className="sobretitulo">Calendário do plantio</p>
        <h1 className="titulo">{plantio.especie}</h1>
        <p className="texto-apoio">
          Plantado em {formatarData(plantio.dataPlantio)} · {formatarArea(plantio.area)} ·{' '}
          {plantio.tipoCultivo?.toLowerCase()}
        </p>
      </div>

      {/* Calendário | Dinheiro */}
      <AbasPlantio plantio={plantio} ativa="calendario" voltar={voltar} />

      {/* Situação no estoque + registrar colheita (saída do estoque) */}
      <RegistroColheita plantio={plantio} hoje={hoje} aoAtualizar={setPlantio} />

      {/* Navegação entre meses */}
      <div className="cal-navegacao">
        <button
          type="button"
          className="cal-navegacao__botao"
          onClick={() => mudarMes(-1)}
          aria-label="Mês anterior"
        >
          <Icone nome="voltar" tamanho={22} />
        </button>
        <h2 className="cal-navegacao__mes" aria-live="polite">
          {nomeMes(mes)} {ano}
        </h2>
        <button
          type="button"
          className="cal-navegacao__botao"
          onClick={() => mudarMes(1)}
          aria-label="Próximo mês"
        >
          <Icone nome="avancar" tamanho={22} />
        </button>
      </div>
      {!estaNoMesDeHoje && (
        <button type="button" className="botao-texto cal-ir-hoje" onClick={irParaHoje}>
          Voltar para hoje
        </button>
      )}

      <p className={`cal-epoca cal-epoca--${epoca.tipo}`}>{epoca.texto}</p>

      <CalendarioMes
        ano={ano}
        mes={mes}
        periodos={periodos}
        hoje={hoje}
        selecionado={selecionado}
        aoSelecionar={setSelecionado}
      />

      {/* Legenda das cores */}
      <ul className="cal-legenda" aria-label="Legenda">
        {Object.entries(CATEGORIAS).map(([chave, { rotulo }]) => (
          <li key={chave}>
            <span className={`cal-legenda__marca cal-legenda__marca--${chave}`} aria-hidden="true" />
            {rotulo}
          </li>
        ))}
      </ul>

      {/* O que acontece no dia tocado */}
      {selecionado && (
        <section className="cartao cal-detalhe" aria-live="polite">
          <h2 className="subtitulo">{selecionado === hoje ? `Hoje, ${diaEMes(selecionado)}` : diaEMes(selecionado)}</h2>
          {periodosSelecionado.length ? (
            <ul className="cal-eventos">
              {periodosSelecionado.map((p) => (
                <li key={`${p.categoria}-${p.inicio}`} className="cal-evento">
                  <span className={`cal-bolinha cal-bolinha--${p.categoria}`} aria-hidden="true" />
                  <div>
                    <p className="cal-evento__nome">
                      {p.nome}
                      {p.categoria === 'chuva' && chuvaDoDia
                        ? ` — ${Math.round(chuvaDoDia.mm)} mm neste dia`
                        : ''}
                    </p>
                    {p.inicio !== p.fim && (
                      <p className="cal-evento__periodo">{textoPeriodo(p.inicio, p.fim)}</p>
                    )}
                    <p className="cal-evento__dica">{p.dica}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="texto-apoio">Nada marcado para este dia.</p>
          )}
        </section>
      )}

      {/* De onde vêm as informações */}
      {!temCiclo && (
        <Aviso tipo="info">
          Ainda não temos o ciclo de {plantio.especie}. O calendário mostra só o dia do plantio e a
          chuva prevista.
        </Aviso>
      )}
      {buscandoPrevisao ? (
        <Carregando texto="Buscando a previsão de chuva..." />
      ) : !previsao ? (
        <Aviso tipo="info">
          Não conseguimos buscar a previsão de chuva agora. Mostrando só a época do ano.
        </Aviso>
      ) : (
        previsao.desatualizada && (
          <Aviso tipo="info">
            Não conseguimos atualizar a previsão agora: mostrando a última previsão de chuva salva.
          </Aviso>
        )
      )}

      <Link
        to={`/plantios/${plantio.id}/editar`}
        state={{ plantio }}
        className="botao botao--secundario"
      >
        <Icone nome="lapis" tamanho={18} /> Editar ou excluir plantio
      </Link>
    </Layout>
  );
}
