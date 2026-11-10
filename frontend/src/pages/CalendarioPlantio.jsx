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
// Topo: um resumo de "hoje" (em que fase está e o que vem a seguir).
// =============================================================
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Aviso from '../components/Aviso';
import CalendarioMes, { periodosDoDia } from '../components/CalendarioMes';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import { CATEGORIAS, CICLOS, epocaDoMes } from '../config/ciclos';
import { buscarPrevisaoChuva } from '../services/climaService';
import { buscarPlantio } from '../services/plantioService';
import {
  deIso,
  diaEMes,
  diasEntre,
  hoje as calcularHoje,
  nomeMes,
  partes,
  somarDias,
  textoPeriodo,
} from '../utils/datas';
import { formatarArea, formatarData } from '../utils/formatadores';

/** Monta todos os períodos do plantio (ciclo + chuva), em ordem de data. */
function montarPeriodos(plantio, previsao) {
  const dataPlantio = deIso(plantio.dataPlantio);

  const etapas = (CICLOS[plantio.especie] || []).map((etapa) => ({
    categoria: etapa.categoria,
    nome: etapa.nome,
    inicio: somarDias(dataPlantio, etapa.de),
    fim: somarDias(dataPlantio, etapa.ate),
    dica: etapa.dica,
  }));

  const chuvas = (previsao?.periodos || []).map((p) => ({
    categoria: 'chuva',
    nome: 'Chuva prevista',
    inicio: p.inicio,
    fim: p.fim,
    dica: `Cerca de ${Math.round(p.mm)} mm de chuva no período.`,
  }));

  return [
    { categoria: 'plantio', nome: 'Plantio', inicio: dataPlantio, fim: dataPlantio, dica: 'Dia em que você plantou.' },
    ...etapas,
    ...chuvas,
  ].sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/** Mês que abre primeiro: o de hoje (se o plantio está no ciclo) ou o do plantio. */
function mesInicial(periodos, hoje) {
  const inicio = periodos[0]?.inicio || hoje;
  const fim = periodos.reduce((maior, p) => (p.fim > maior ? p.fim : maior), inicio);
  const referencia = hoje >= inicio && hoje <= fim ? hoje : inicio;
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
  const [selecionado, setSelecionado] = useState(hoje);

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
    () => (plantio ? montarPeriodos(plantio, previsao) : []),
    [plantio, previsao],
  );

  // Abre no mês certo assim que o plantio chega
  useEffect(() => {
    if (plantio && !mesVisivel) setMesVisivel(mesInicial(periodos, hoje));
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

  const dataPlantio = deIso(plantio.dataPlantio);
  const temCiclo = Boolean(CICLOS[plantio.especie]);
  const { ano, mes } = mesVisivel;

  // ---------- Resumo de hoje ----------
  const diaDoPlantio = diasEntre(dataPlantio, hoje); // 0 = dia do plantio
  const etapasHoje = periodosDoDia(periodos, hoje).filter((p) => p.categoria !== 'chuva');
  const proximaEtapa = periodos.find((p) => p.categoria !== 'chuva' && p.inicio > hoje);
  const proximaChuva = periodos.find((p) => p.categoria === 'chuva' && p.fim >= hoje);

  // ---------- Mês visível ----------
  const primeiroDoMes = `${ano}-${String(mes + 1).padStart(2, '0')}-01`;
  const ultimoDoMes = somarDias(
    `${mes === 11 ? ano + 1 : ano}-${String(((mes + 1) % 12) + 1).padStart(2, '0')}-01`,
    -1,
  );
  const periodosDoMes = periodos.filter((p) => p.inicio <= ultimoDoMes && p.fim >= primeiroDoMes);
  const epoca = epocaDoMes(mes);
  const mesDeHoje = partes(hoje);
  const estaNoMesDeHoje = mesDeHoje.ano === ano && mesDeHoje.mes === mes;

  /** Vai para o mês anterior (-1) ou o próximo (+1). */
  function mudarMes(passo) {
    const novo = new Date(Date.UTC(ano, mes + passo, 1));
    setMesVisivel({ ano: novo.getUTCFullYear(), mes: novo.getUTCMonth() });
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

      {/* Resumo de hoje */}
      <section className="cartao cal-hoje" aria-label="Resumo de hoje">
        <p className="cal-hoje__titulo">
          {diaDoPlantio < 0
            ? `Faltam ${-diaDoPlantio} ${diaDoPlantio === -1 ? 'dia' : 'dias'} para o plantio`
            : diaDoPlantio === 0
              ? 'Hoje é o dia do plantio'
              : `Hoje é o ${diaDoPlantio}º dia do plantio`}
        </p>
        {etapasHoje.filter((p) => p.categoria !== 'plantio').length > 0 && (
          <ul className="cal-hoje__lista">
            {etapasHoje
              .filter((p) => p.categoria !== 'plantio')
              .map((p) => (
                <li key={p.nome}>
                  <span className={`cal-bolinha cal-bolinha--${p.categoria}`} aria-hidden="true" />
                  <span>
                    <strong>{p.nome}</strong> — {p.dica}
                  </span>
                </li>
              ))}
          </ul>
        )}
        {proximaEtapa && (
          <p className="cal-hoje__proxima">
            Próxima etapa: <strong>{proximaEtapa.nome}</strong>, a partir de{' '}
            {diaEMes(proximaEtapa.inicio)}
          </p>
        )}
        {proximaChuva && (
          <p className="cal-hoje__proxima">
            <Icone nome="chuva" tamanho={18} /> Próxima chuva:{' '}
            <strong>{textoPeriodo(proximaChuva.inicio, proximaChuva.fim)}</strong>
          </p>
        )}
      </section>

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

      {/* Tudo o que acontece no mês, em lista (mais fácil de ler que a grade) */}
      <section className="cartao">
        <h2 className="subtitulo">
          Em {nomeMes(mes)}
        </h2>
        {periodosDoMes.length ? (
          <ul className="cal-eventos">
            {periodosDoMes.map((p) => (
              <li key={`${p.categoria}-${p.inicio}`} className="cal-evento">
                <span className={`cal-bolinha cal-bolinha--${p.categoria}`} aria-hidden="true" />
                <div>
                  <p className="cal-evento__periodo-destaque">{textoPeriodo(p.inicio, p.fim)}</p>
                  <p className="cal-evento__nome">{p.nome}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="texto-apoio">Nenhuma etapa deste plantio neste mês.</p>
        )}
      </section>

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
          Sem internet agora: não foi possível buscar a previsão de chuva. Mostrando só a época do
          ano.
        </Aviso>
      ) : (
        previsao.desatualizada && (
          <Aviso tipo="info">Sem internet agora: mostrando a última previsão de chuva salva.</Aviso>
        )
      )}
      <p className="texto-apoio">
        As etapas são uma estimativa pelo ciclo médio da espécie. A chuva vem da previsão do tempo
        para Rio Preto da Eva (próximos 16 dias).
      </p>

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
