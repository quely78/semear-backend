// =============================================================
// components/RegistroColheita.jsx — Situação do plantio no estoque
// e registro da colheita (a SAÍDA do estoque).
//
//   Não colhido: mostra a situação (crescendo / pronto / atrasado)
//                e o botão "Registrar colheita" (data + kg).
//   Colhido:     mostra "Colhido em 10/11 · 35 kg" e "Desfazer".
// =============================================================
import { useState } from 'react';
import { desfazerColheita, registrarColheita } from '../services/plantioService';
import { diaEMes, deIso } from '../utils/datas';
import { formatarKg, janelaDeColheita, situacaoDoPlantio, SITUACOES } from '../utils/estoque';
import { formatarData } from '../utils/formatadores';
import { converterNumero } from '../utils/validacoes';
import Aviso from './Aviso';
import Campo from './Campo';
import Icone from './Icone';

export default function RegistroColheita({ plantio, hoje, aoAtualizar }) {
  const situacao = situacaoDoPlantio(plantio, hoje);
  const janela = janelaDeColheita(plantio);

  const [abrindo, setAbrindo] = useState(false); // formulário aberto?
  const [form, setForm] = useState({ dataColheita: hoje, quantidade: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);

  function aoDigitar(evento) {
    const { name, value } = evento.target;
    setForm((atual) => ({ ...atual, [name]: value }));
    setErros((atual) => ({ ...atual, [name]: '' }));
  }

  async function aoSalvar(evento) {
    evento.preventDefault();
    const kg = converterNumero(form.quantidade);
    const novosErros = {
      dataColheita: !form.dataColheita
        ? 'Informe a data da colheita.'
        : form.dataColheita < deIso(plantio.dataPlantio)
          ? 'A colheita não pode ser antes do plantio.'
          : form.dataColheita > hoje
            ? 'A data não pode estar no futuro.'
            : '',
      quantidade: !(kg > 0) ? 'Informe quantos quilos você colheu.' : '',
    };
    setErros(novosErros);
    if (novosErros.dataColheita || novosErros.quantidade) return;

    setSalvando(true);
    setErroGeral('');
    try {
      const atualizado = await registrarColheita(plantio.id, {
        dataColheita: form.dataColheita,
        quantidadeColhida: kg,
      });
      aoAtualizar(atualizado);
      setAbrindo(false);
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  async function aoDesfazer() {
    setSalvando(true);
    setErroGeral('');
    try {
      aoAtualizar(await desfazerColheita(plantio.id));
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setSalvando(false);
    }
  }

  // ---------- Já colhido ----------
  if (situacao === 'colhido') {
    return (
      <section className={`cartao estoque-plantio estoque-plantio--colhido`}>
        <div className="estoque-plantio__topo">
          <span className="selo selo--colhido">{SITUACOES.colhido.rotulo}</span>
          <strong className="estoque-plantio__kg">{formatarKg(plantio.quantidadeColhida)}</strong>
        </div>
        <p className="texto-apoio">Colhido em {formatarData(plantio.dataColheita)}.</p>
        <Aviso tipo="erro">{erroGeral}</Aviso>
        <button
          type="button"
          className="botao-texto estoque-plantio__desfazer"
          onClick={aoDesfazer}
          disabled={salvando}
        >
          {salvando ? 'Desfazendo...' : 'Desfazer colheita (registrei por engano)'}
        </button>
      </section>
    );
  }

  // ---------- Ainda no campo ----------
  const textoSituacao = {
    crescendo: janela
      ? `Época de colher: a partir de ${diaEMes(janela.inicio)}.`
      : 'Registre a colheita quando colher.',
    pronto: janela ? `Época de colher vai até ${diaEMes(janela.fim)}.` : '',
    atrasado: janela ? `A época de colher terminou em ${diaEMes(janela.fim)}.` : '',
  }[situacao];

  return (
    <section className={`cartao estoque-plantio estoque-plantio--${situacao}`}>
      <div className="estoque-plantio__topo">
        <span className={`selo selo--${situacao}`}>{SITUACOES[situacao].rotulo}</span>
      </div>
      <p className="texto-apoio">{textoSituacao}</p>

      {abrindo ? (
        <form className="formulario estoque-plantio__form" onSubmit={aoSalvar} noValidate>
          <div className="estoque-plantio__campos">
            <Campo id="dataColheita" rotulo="Data da colheita" erro={erros.dataColheita}>
              <input
                id="dataColheita"
                name="dataColheita"
                type="date"
                max={hoje}
                value={form.dataColheita}
                onChange={aoDigitar}
              />
            </Campo>
            <Campo id="quantidade" rotulo="Quilos colhidos" erro={erros.quantidade}>
              <input
                id="quantidade"
                name="quantidade"
                type="text"
                inputMode="decimal"
                placeholder="0,0"
                value={form.quantidade}
                onChange={aoDigitar}
              />
            </Campo>
          </div>
          <Aviso tipo="erro">{erroGeral}</Aviso>
          <div className="confirmacao__botoes">
            <button
              type="button"
              className="botao botao--secundario"
              onClick={() => setAbrindo(false)}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button type="submit" className="botao botao--primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className={`botao ${situacao === 'crescendo' ? 'botao--secundario' : 'botao--primario'}`}
          onClick={() => setAbrindo(true)}
        >
          <Icone nome="cesta" tamanho={20} /> Registrar colheita
        </button>
      )}
    </section>
  );
}
