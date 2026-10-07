// =============================================================
// pages/FormPlantio.jsx — Telas 04 e 07: Cadastrar/editar plantio
// (RF03/RF04/RF05) com validação de dados.
//
// A mesma tela serve para:
//   /plantios/novo          → cadastrar
//   /plantios/:id/editar    → editar (e mostra o botão "Excluir plantio")
//
// Regras (Tela 7):
//   RN02 — área somente positiva
//   RN03 — data até 12 meses no futuro
//   Se houver erro: campos ficam destacados + "Corrija os campos destacados"
//   Se der certo: volta para a lista com "Plantio salvo com sucesso"
// =============================================================
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import { ESPECIES, OUTRA_ESPECIE, TIPOS_CULTIVO } from '../config/dados';
import {
  buscarPlantio,
  criarPlantio,
  editarPlantio,
  excluirPlantio,
} from '../services/plantioService';
import { paraInputData } from '../utils/formatadores';
import {
  converterNumero,
  temErros,
  validarArea,
  validarDataPlantio,
  validarObrigatorio,
} from '../utils/validacoes';

// Formulário em branco (tipo de cultivo já vem marcado para poupar um toque)
const FORM_VAZIO = {
  especie: '',
  outraEspecie: '',
  dataPlantio: '',
  area: '',
  tipoCultivo: TIPOS_CULTIVO[0].valor,
};

/** Converte um plantio vindo da API para o formato do formulário. */
function plantioParaForm(plantio) {
  const especieConhecida = ESPECIES.includes(plantio.especie);
  return {
    especie: especieConhecida ? plantio.especie : OUTRA_ESPECIE,
    outraEspecie: especieConhecida ? '' : plantio.especie,
    dataPlantio: paraInputData(plantio.dataPlantio),
    area: String(plantio.area).replace('.', ','),
    tipoCultivo: plantio.tipoCultivo?.toLowerCase() || TIPOS_CULTIVO[0].valor,
  };
}

export default function FormPlantio() {
  const { id } = useParams(); // existe só na edição
  const editando = Boolean(id);
  const navegar = useNavigate();
  const local = useLocation();

  // Se veio da lista, o plantio já chega pelo "state" (sem esperar a API)
  const plantioRecebido = local.state?.plantio;

  const [form, setForm] = useState(
    plantioRecebido ? plantioParaForm(plantioRecebido) : FORM_VAZIO,
  );
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(editando && !plantioRecebido);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  // Na edição sem "state" (ex.: página recarregada), busca o plantio na API
  useEffect(() => {
    if (!editando || plantioRecebido) return;
    buscarPlantio(id)
      .then((plantio) => {
        if (plantio) setForm(plantioParaForm(plantio));
        else setErroGeral('Plantio não encontrado.');
      })
      .catch((erro) => setErroGeral(erro.message))
      .finally(() => setCarregando(false));
  }, [editando, id, plantioRecebido]);

  /** Atualiza um campo e limpa o erro dele. */
  function aoDigitar(evento) {
    const { name, value } = evento.target;
    setForm((atual) => ({ ...atual, [name]: value }));
    setErros((atual) => ({ ...atual, [name]: '' }));
    setErroGeral('');
  }

  /** Nome final da espécie (do select ou do campo "Outra"). */
  const especieFinal = form.especie === OUTRA_ESPECIE ? form.outraEspecie.trim() : form.especie;

  /** Aplica todas as regras e devolve os erros encontrados. */
  function validar() {
    return {
      especie: form.especie ? '' : 'Selecione a espécie.',
      outraEspecie:
        form.especie === OUTRA_ESPECIE ? validarObrigatorio(form.outraEspecie, 'O nome da espécie') : '',
      dataPlantio: validarDataPlantio(form.dataPlantio),
      area: validarArea(form.area),
      tipoCultivo: form.tipoCultivo ? '' : 'Escolha o tipo de cultivo.',
    };
  }

  /** Salvar plantio (criar ou editar). */
  async function aoSalvar(evento) {
    evento.preventDefault();

    const novosErros = validar();
    setErros(novosErros);
    if (temErros(novosErros)) {
      // Mensagem geral da Tela 7
      setErroGeral('Corrija os campos destacados para continuar.');
      return;
    }

    // Dados no formato que a API espera
    const dados = {
      especie: especieFinal,
      dataPlantio: form.dataPlantio, // "AAAA-MM-DD"
      area: converterNumero(form.area), // "12,5" → 12.5
      tipoCultivo: form.tipoCultivo,
    };

    setSalvando(true);
    try {
      if (editando) await editarPlantio(id, dados);
      else await criarPlantio(dados);
      // Sucesso: volta para a lista mostrando a confirmação
      navegar('/plantios', { replace: true, state: { mensagem: 'Plantio salvo com sucesso' } });
    } catch (erro) {
      // Erro vindo da API (ex.: validação do back-end ou sem internet)
      setErroGeral(erro.message);
      setSalvando(false);
    }
  }

  /** Excluir plantio (só na edição, depois de confirmar). */
  async function aoExcluir() {
    setSalvando(true);
    try {
      await excluirPlantio(id);
      navegar('/plantios', { replace: true, state: { mensagem: 'Plantio excluído.' } });
    } catch (erro) {
      setErroGeral(erro.message);
      setSalvando(false);
      setConfirmandoExclusao(false);
    }
  }

  const titulo = editando ? 'Editar plantio' : 'Novo plantio';

  return (
    <Layout cabecalho={{ titulo, voltarPara: '/plantios' }} comMenu={false}>
      {carregando ? (
        <Carregando texto="Abrindo plantio..." />
      ) : (
        <form className="formulario" onSubmit={aoSalvar} noValidate>
          <h1 className="titulo">{titulo}</h1>

          {/* Espécie */}
          <Campo id="especie" rotulo="Espécie" erro={erros.especie}>
            <select id="especie" name="especie" value={form.especie} onChange={aoDigitar}>
              <option value="">Selecionar espécie</option>
              {ESPECIES.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
              <option value={OUTRA_ESPECIE}>Outra espécie...</option>
            </select>
          </Campo>

          {/* Aparece só quando escolhe "Outra espécie" */}
          {form.especie === OUTRA_ESPECIE && (
            <Campo id="outraEspecie" rotulo="Qual espécie?" erro={erros.outraEspecie}>
              <input
                id="outraEspecie"
                name="outraEspecie"
                type="text"
                placeholder="ex.: Cupuaçu"
                value={form.outraEspecie}
                onChange={aoDigitar}
              />
            </Campo>
          )}

          {/* Data de plantio — RN03 */}
          <Campo
            id="dataPlantio"
            rotulo="Data de plantio"
            dica="Até 12 meses no futuro"
            erro={erros.dataPlantio}
          >
            <input
              id="dataPlantio"
              name="dataPlantio"
              type="date"
              value={form.dataPlantio}
              onChange={aoDigitar}
            />
          </Campo>

          {/* Área — RN02 */}
          <Campo
            id="area"
            rotulo="Área plantada (m²)"
            dica="Somente valor positivo"
            erro={erros.area}
          >
            <input
              id="area"
              name="area"
              type="text"
              inputMode="decimal" // abre o teclado numérico no celular
              placeholder="0,00"
              value={form.area}
              onChange={aoDigitar}
            />
          </Campo>

          {/* Tipo de cultivo — botões de opção grandes */}
          <fieldset className="opcoes">
            <legend className="campo__rotulo">Tipo de cultivo</legend>
            <div className="opcoes__grupo">
              {TIPOS_CULTIVO.map((tipo) => (
                <label
                  key={tipo.valor}
                  className={`opcao ${form.tipoCultivo === tipo.valor ? 'opcao--ativa' : ''}`}
                >
                  <input
                    type="radio"
                    name="tipoCultivo"
                    value={tipo.valor}
                    checked={form.tipoCultivo === tipo.valor}
                    onChange={aoDigitar}
                  />
                  {tipo.rotulo}
                </label>
              ))}
            </div>
            {erros.tipoCultivo && <p className="campo__erro">✕ {erros.tipoCultivo}</p>}
          </fieldset>

          <button className="botao botao--primario" type="submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar plantio'}
          </button>

          {/* Mensagem geral de erro (Tela 7) logo abaixo do botão */}
          <Aviso tipo="erro">{erroGeral}</Aviso>

          {/* Excluir: só na edição, com confirmação para evitar acidentes */}
          {editando &&
            (confirmandoExclusao ? (
              <div className="confirmacao" role="alertdialog" aria-label="Confirmar exclusão">
                <p>Tem certeza? Este plantio será apagado.</p>
                <div className="confirmacao__botoes">
                  <button
                    type="button"
                    className="botao botao--secundario"
                    onClick={() => setConfirmandoExclusao(false)}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="botao botao--perigo"
                    onClick={aoExcluir}
                    disabled={salvando}
                  >
                    Sim, excluir
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="botao botao--perigo-contorno"
                onClick={() => setConfirmandoExclusao(true)}
              >
                <Icone nome="lixeira" tamanho={18} /> Excluir plantio
              </button>
            ))}
        </form>
      )}
    </Layout>
  );
}