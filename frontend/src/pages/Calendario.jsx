// =============================================================
// pages/Calendario.jsx — Tela 05: Calendário agrícola (RF07).
// Tabela de referência (somente consulta) com busca por espécie.
// =============================================================
import { useEffect, useState } from 'react';
import Aviso from '../components/Aviso';
import Carregando from '../components/Carregando';
import Campo from '../components/Campo';
import Layout from '../components/Layout';
import { carregarCalendario, consultarEspecie } from '../services/calendarioService';

/** Remove acentos e deixa minúsculo: "Feijão" → "feijao" (busca mais tolerante). */
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export default function Calendario() {
  const [linhas, setLinhas] = useState([]);
  const [usouReferencia, setUsouReferencia] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  // Resultado extra quando a espécie buscada não está na tabela
  const [extra, setExtra] = useState(null);
  const [buscandoExtra, setBuscandoExtra] = useState(false);

  // Carrega a tabela ao abrir a tela
  useEffect(() => {
    carregarCalendario()
      .then((resultado) => {
        setLinhas(resultado.linhas);
        setUsouReferencia(resultado.usouReferencia);
      })
      .finally(() => setCarregando(false));
  }, []);

  // Filtra a tabela conforme a busca
  const linhasFiltradas = linhas.filter((linha) =>
    normalizar(linha.especie).includes(normalizar(busca)),
  );

  /**
   * Ao apertar "Buscar": se a espécie não estiver na tabela,
   * pergunta direto para a API (pode existir no banco).
   */
  async function aoBuscar(evento) {
    evento.preventDefault();
    setExtra(null);
    if (!busca.trim() || linhasFiltradas.length) return;

    setBuscandoExtra(true);
    try {
      setExtra(await consultarEspecie(busca.trim()));
    } catch {
      setExtra({ naoEncontrada: true });
    } finally {
      setBuscandoExtra(false);
    }
  }

  // Linhas mostradas: as filtradas ou o resultado extra encontrado na API
  const linhasVisiveis = extra && !extra.naoEncontrada ? [extra] : linhasFiltradas;

  return (
    <Layout cabecalho={{ titulo: 'Calendário' }}>
      <h1 className="titulo">Calendário agrícola</h1>

      <form onSubmit={aoBuscar} className="busca" role="search">
        <Campo id="busca" rotulo="Buscar espécie">
          <input
            id="busca"
            type="search"
            placeholder="ex.: milho"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setExtra(null);
            }}
          />
        </Campo>
      </form>

      {carregando || buscandoExtra ? (
        <Carregando texto="Consultando calendário..." />
      ) : (
        <>
          {linhasVisiveis.length ? (
            <div className="tabela-envoltorio">
              <table className="tabela">
                <thead>
                  <tr>
                    <th scope="col">Espécie</th>
                    <th scope="col">Plantio</th>
                    <th scope="col">Colheita</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasVisiveis.map((linha) => (
                    <tr key={linha.especie}>
                      <th scope="row">{linha.especie}</th>
                      <td>{linha.epocaPlantio}</td>
                      <td>{linha.epocaColheita}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="vazio">
              {extra?.naoEncontrada
                ? `Ainda não temos referência para "${busca}".`
                : 'Nenhuma espécie com esse nome. Aperte Enter para buscar no servidor.'}
            </p>
          )}

          <p className="texto-apoio">Tabela de referência — somente consulta.</p>
          {usouReferencia && (
            <Aviso tipo="info">
              Algumas informações vieram da tabela local porque o servidor não respondeu.
            </Aviso>
          )}
        </>
      )}
    </Layout>
  );
}