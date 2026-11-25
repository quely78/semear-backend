// =============================================================
// pages/Calendario.jsx — Tela 05: Calendário agrícola (RF07).
//
// Um calendário do mês com TODOS os plantios da agricultora:
// dia do plantio, etapas (crescimento, cuidados, colheita) e a chuva
// prevista. Tocar num dia mostra o que acontece em cada plantio,
// com link para o calendário daquele plantio.
// Embaixo, a lista dos plantios para abrir um deles.
// =============================================================
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Aviso from '../components/Aviso';
import CalendarioMes, { periodosDoDia } from '../components/CalendarioMes';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import PlantioCard from '../components/PlantioCard';
import { CATEGORIAS, epocaDoMes } from '../config/ciclos';
import { buscarPrevisaoChuva } from '../services/climaService';
import { listarPlantios } from '../services/plantioService';
import { diaEMes, hoje as calcularHoje, nomeMes, partes, textoPeriodo } from '../utils/datas';
import { diaParaSelecionar, montarPeriodos } from '../utils/periodosPlantio';

const VOLTAR = { para: '/calendario', rotulo: 'Calendário' };

export default function Calendario() {
  const hoje = calcularHoje();
  const [plantios, setPlantios] = useState(null); // null = carregando
  const [erro, setErro] = useState('');
  const [previsao, setPrevisao] = useState(null);
  const [previsaoPronta, setPrevisaoPronta] = useState(false);
  const [mesVisivel, setMesVisivel] = useState(() => {
    const { ano, mes } = partes(hoje);
    return { ano, mes };
  });
  const [selecionado, setSelecionado] = useState(hoje);

  useEffect(() => {
    listarPlantios()
      .then(setPlantios)
      .catch((e) => {
        setErro(e.message);
        setPlantios([]);
      });
    buscarPrevisaoChuva()
      .then(setPrevisao)
      .finally(() => setPrevisaoPronta(true));
  }, []);

  const periodos = useMemo(() => montarPeriodos(plantios || [], previsao), [plantios, previsao]);
  const { ano, mes } = mesVisivel;
  const epoca = epocaDoMes(mes);
  const mesDeHoje = partes(hoje);
  const estaNoMesDeHoje = mesDeHoje.ano === ano && mesDeHoje.mes === mes;

  function mudarMes(passo) {
    const novo = new Date(Date.UTC(ano, mes + passo, 1));
    const proximo = { ano: novo.getUTCFullYear(), mes: novo.getUTCMonth() };
    setMesVisivel(proximo);
    setSelecionado(diaParaSelecionar(proximo.ano, proximo.mes, periodos, hoje));
  }

  // O que acontece no dia tocado, agrupado por plantio
  const doDia = selecionado ? periodosDoDia(periodos, selecionado) : [];
  const chuva = doDia.find((p) => p.categoria === 'chuva');
  const porPlantio = new Map();
  doDia
    .filter((p) => p.plantio)
    .forEach((p) => {
      if (!porPlantio.has(p.plantio.id)) porPlantio.set(p.plantio.id, { plantio: p.plantio, eventos: [] });
      porPlantio.get(p.plantio.id).eventos.push(p);
    });

  return (
    <Layout>
      <div>
        <h1 className="titulo">Calendário</h1>
      </div>

      {plantios === null ? (
        <Carregando texto="Montando o calendário..." />
      ) : erro ? (
        <Aviso tipo="erro">{erro}</Aviso>
      ) : plantios.length === 0 ? (
        <div className="vazio">
          <img src="/icone.png" alt="" className="vazio__imagem" />
          <p>Quando você registrar um plantio, as etapas dele aparecem aqui.</p>
          <Link to="/plantios/novo" className="botao botao--primario">
            Registrar meu primeiro plantio
          </Link>
        </div>
      ) : (
        <>
          <div className="cal-navegacao">
            <button type="button" className="cal-navegacao__botao" onClick={() => mudarMes(-1)} aria-label="Mês anterior">
              <Icone nome="voltar" tamanho={22} />
            </button>
            <h2 className="cal-navegacao__mes" aria-live="polite">
              {nomeMes(mes)} {ano}
            </h2>
            <button type="button" className="cal-navegacao__botao" onClick={() => mudarMes(1)} aria-label="Próximo mês">
              <Icone nome="avancar" tamanho={22} />
            </button>
          </div>
          {!estaNoMesDeHoje && (
            <button
              type="button"
              className="botao-texto cal-ir-hoje"
              onClick={() => {
                setMesVisivel({ ano: mesDeHoje.ano, mes: mesDeHoje.mes });
                setSelecionado(hoje);
              }}
            >
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

          <ul className="cal-legenda" aria-label="Legenda">
            {Object.entries(CATEGORIAS).map(([chave, { rotulo }]) => (
              <li key={chave}>
                <span className={`cal-legenda__marca cal-legenda__marca--${chave}`} aria-hidden="true" />
                {rotulo}
              </li>
            ))}
          </ul>

          {selecionado && (
            <section className="cartao cal-detalhe" aria-live="polite">
              <h2 className="subtitulo">{selecionado === hoje ? `Hoje, ${diaEMes(selecionado)}` : diaEMes(selecionado)}</h2>
              {chuva && (
                <p className="cal-detalhe__chuva">
                  <span className="cal-bolinha cal-bolinha--chuva" aria-hidden="true" /> {chuva.nome}: {chuva.dica}
                </p>
              )}
              {porPlantio.size === 0 ? (
                !chuva && <p className="texto-apoio">Nada marcado para este dia.</p>
              ) : (
                <ul className="cal-plantios-dia">
                  {[...porPlantio.values()].map(({ plantio, eventos }) => (
                    <li key={plantio.id}>
                      <Link
                        to={`/plantios/${plantio.id}/calendario`}
                        state={{ plantio, voltar: VOLTAR }}
                        className="cal-plantios-dia__item"
                      >
                        <span className="cal-plantios-dia__nome">{plantio.especie}</span>
                        {eventos.map((p) => (
                          <span key={`${p.categoria}-${p.inicio}`} className="cal-evento cal-evento--compacto">
                            <span className={`cal-bolinha cal-bolinha--${p.categoria}`} aria-hidden="true" />
                            <span>
                              {p.nome}
                              {p.inicio !== p.fim && <span className="cal-evento__periodo"> · {textoPeriodo(p.inicio, p.fim)}</span>}
                            </span>
                          </span>
                        ))}
                        <Icone nome="avancar" tamanho={18} className="cal-plantios-dia__seta" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {previsaoPronta && !previsao && (
            <Aviso tipo="info">Não conseguimos buscar a previsão de chuva agora. Mostrando só a época do ano.</Aviso>
          )}

          <section>
            <h2 className="subtitulo">Calendário de um plantio</h2>
            <ul className="lista">
              {plantios.map((plantio) => (
                <li key={plantio.id}>
                  <PlantioCard plantio={plantio} voltar={VOLTAR} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </Layout>
  );
}
