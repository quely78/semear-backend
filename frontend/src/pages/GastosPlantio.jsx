// =============================================================
// pages/GastosPlantio.jsx — Gastos de UM plantio.
//   /plantios/:id/gastos
//
// Em cima: anotar um gasto (com o quê, quanto, quando).
// Embaixo: total, barra "para onde foi o dinheiro" e a lista (com apagar).
// =============================================================
import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import useFinancasDoPlantio from '../hooks/useFinancasDoPlantio';
import { anotarGasto, apagarGasto } from '../services/financasService';
import { hoje as calcularHoje } from '../utils/datas';
import {
  CATEGORIAS_GASTO,
  converterDinheiro,
  erroDoDinheiro,
  formatarReais,
  rotuloCategoria,
} from '../utils/dinheiro';
import { formatarData } from '../utils/formatadores';

const corDa = (categoria) => CATEGORIAS_GASTO.find((c) => c.valor === categoria)?.cor;

export default function GastosPlantio() {
  const { id } = useParams();
  const local = useLocation();
  const hoje = calcularHoje();
  const cabecalho = { voltarPara: `/plantios/${id}/dinheiro`, rotuloVoltar: 'Dinheiro do plantio' };
  const { financas, setFinancas, carregando, erro } = useFinancasDoPlantio(id);

  const formVazio = { categoria: '', valor: '', data: hoje, descricao: '' };
  const [form, setForm] = useState(formVazio);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  function aoDigitar(evento) {
    const { name, value } = evento.target;
    setForm((atual) => ({ ...atual, [name]: value }));
    setErros((atual) => ({ ...atual, [name]: '' }));
    setSucesso('');
  }

  async function aoSalvar(evento) {
    evento.preventDefault();
    const novosErros = {
      categoria: form.categoria ? '' : 'Escolha com o que foi o gasto.',
      valor: erroDoDinheiro(form.valor, 'quanto custou'),
      data: !form.data ? 'Informe a data.' : form.data > hoje ? 'A data não pode estar no futuro.' : '',
    };
    setErros(novosErros);
    if (Object.values(novosErros).some(Boolean)) return;

    setSalvando(true);
    setErroGeral('');
    try {
      const atualizado = await anotarGasto(id, {
        categoria: form.categoria,
        valor: converterDinheiro(form.valor),
        data: form.data,
        descricao: form.descricao.trim() || undefined,
      });
      setFinancas(atualizado);
      setForm(formVazio);
      setSucesso(`Gasto de ${formatarReais(converterDinheiro(form.valor))} anotado.`);
    } catch (e) {
      if (e.campos) setErros(e.campos);
      else setErroGeral(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function aoApagar(gasto) {
    const texto = `${rotuloCategoria(gasto.categoria)} de ${formatarReais(gasto.valor)}`;
    if (!window.confirm(`Apagar o gasto "${texto}"?`)) return;
    setErroGeral('');
    setSucesso('');
    try {
      setFinancas(await apagarGasto(id, gasto.id));
      setSucesso('Gasto apagado.');
    } catch (e) {
      setErroGeral(e.message);
    }
  }

  if (carregando) {
    return (
      <Layout cabecalho={cabecalho}>
        <Carregando texto="Buscando os gastos..." />
      </Layout>
    );
  }
  if (!financas) {
    return (
      <Layout cabecalho={cabecalho}>
        <Aviso tipo="erro">{erro || 'Plantio não encontrado.'}</Aviso>
      </Layout>
    );
  }

  const { plantio, gastos, resumo } = financas;
  const especie = local.state?.plantio?.especie || plantio.especie;

  // Quanto foi para cada categoria (barra e legenda)
  const porCategoria = CATEGORIAS_GASTO.map((c) => ({
    ...c,
    total: gastos.filter((g) => g.categoria === c.valor).reduce((soma, g) => soma + g.valor, 0),
  })).filter((c) => c.total > 0);

  return (
    <Layout cabecalho={cabecalho}>
      <h1 className="titulo">Gastos: {especie.toLowerCase()}</h1>

      <form className="cartao formulario" onSubmit={aoSalvar} noValidate>
        <h2 className="subtitulo subtitulo--sem-margem">Anotar um gasto</h2>

        <fieldset className="opcoes">
          <legend className="campo__rotulo">Com o quê?</legend>
          <div className="opcoes__grupo">
            {CATEGORIAS_GASTO.map((c) => (
              <label key={c.valor} className={`opcao ${form.categoria === c.valor ? 'opcao--ativa' : ''}`}>
                <input
                  type="radio"
                  name="categoria"
                  value={c.valor}
                  checked={form.categoria === c.valor}
                  onChange={aoDigitar}
                />
                {c.rotulo}
              </label>
            ))}
          </div>
          {erros.categoria && <p className="campo__erro" role="alert">✕ {erros.categoria}</p>}
        </fieldset>

        <div className="financas__campos">
          <Campo id="valor" rotulo="Quanto custou? (R$)" erro={erros.valor}>
            <input id="valor" name="valor" type="text" inputMode="decimal" placeholder="0,00" value={form.valor} onChange={aoDigitar} />
          </Campo>
          <Campo id="data" rotulo="Quando?" erro={erros.data}>
            <input id="data" name="data" type="date" max={hoje} value={form.data} onChange={aoDigitar} />
          </Campo>
        </div>

        <Campo id="descricao" rotulo="Observação (opcional)" dica="Ex.: 2 diárias, frete até a feira" erro={erros.descricao}>
          <input id="descricao" name="descricao" type="text" maxLength={120} value={form.descricao} onChange={aoDigitar} />
        </Campo>

        <Aviso tipo="erro">{erroGeral}</Aviso>
        <Aviso tipo="sucesso">{sucesso}</Aviso>
        <button type="submit" className="botao botao--primario" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar gasto'}
        </button>
      </form>

      <section className="cartao">
        <div className="financas__linha-total">
          <h2 className="subtitulo subtitulo--sem-margem">Total gasto</h2>
          <strong className="financas__total financas__total--saida">{formatarReais(resumo.gastos)}</strong>
        </div>

        {gastos.length === 0 ? (
          <p className="texto-apoio">Nenhum gasto anotado neste plantio ainda.</p>
        ) : (
          <>
            <div
              className="estoque-barra financas__barra"
              role="img"
              aria-label={porCategoria.map((c) => `${c.rotulo} ${formatarReais(c.total)}`).join(', ')}
            >
              {porCategoria.map((c) => (
                <span
                  key={c.valor}
                  className="estoque-barra__parte"
                  style={{ width: `${(c.total / resumo.gastos) * 100}%`, background: c.cor }}
                />
              ))}
            </div>
            <ul className="financas__lista">
              {gastos.map((g) => (
                <li key={g.id} className="financas__item">
                  <span className="financas__cor" style={{ background: corDa(g.categoria) }} aria-hidden="true" />
                  <div className="financas__item-texto">
                    <p className="financas__item-titulo">{rotuloCategoria(g.categoria)}</p>
                    <p className="texto-apoio">
                      {formatarData(g.data)}
                      {g.descricao ? ` · ${g.descricao}` : ''}
                    </p>
                  </div>
                  <strong>{formatarReais(g.valor)}</strong>
                  <button
                    type="button"
                    className="financas__apagar"
                    onClick={() => aoApagar(g)}
                    aria-label={`Apagar gasto ${rotuloCategoria(g.categoria)} de ${formatarReais(g.valor)}`}
                  >
                    <Icone nome="lixeira" tamanho={18} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </Layout>
  );
}
