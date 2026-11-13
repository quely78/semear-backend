// =============================================================
// pages/VendasPlantio.jsx — Vendas de UM plantio.
//   /plantios/:id/vendas
//
// Venda = saída do que foi colhido. Só dá para vender depois de
// registrar a colheita, e no máximo o que ainda está no estoque.
// Enquanto ela digita, mostra quanto vai receber e se o preço
// está acima do preço mínimo (o que cada kg custou).
// =============================================================
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import useFinancasDoPlantio from '../hooks/useFinancasDoPlantio';
import { anotarVenda, apagarVenda } from '../services/financasService';
import { deIso, hoje as calcularHoje } from '../utils/datas';
import {
  CANAIS_VENDA,
  converterDinheiro,
  erroDoDinheiro,
  formatarReais,
  rotuloCanal,
} from '../utils/dinheiro';
import { formatarKg } from '../utils/estoque';
import { formatarData } from '../utils/formatadores';
import { converterNumero } from '../utils/validacoes';

export default function VendasPlantio() {
  const { id } = useParams();
  const hoje = calcularHoje();
  const cabecalho = { voltarPara: `/plantios/${id}/dinheiro`, rotuloVoltar: 'Dinheiro do plantio' };
  const { financas, setFinancas, carregando, erro } = useFinancasDoPlantio(id);

  const formVazio = { quantidadeKg: '', precoKg: '', canal: '', data: hoje };
  const [form, setForm] = useState(formVazio);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  if (carregando) {
    return (
      <Layout cabecalho={cabecalho}>
        <Carregando texto="Buscando as vendas..." />
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

  const { plantio, vendas, resumo } = financas;
  const dataColheita = plantio.dataColheita ? deIso(plantio.dataColheita) : null;
  const estoque = resumo.kgEmEstoque || 0;

  // Prévia do que ela vai receber
  const kg = converterNumero(form.quantidadeKg);
  const preco = converterDinheiro(form.precoKg);
  const temPrevia = kg > 0 && preco > 0;
  const abaixoDoMinimo = temPrevia && resumo.precoMinimoKg > 0 && preco < resumo.precoMinimoKg;

  function aoDigitar(evento) {
    const { name, value } = evento.target;
    setForm((atual) => ({ ...atual, [name]: value }));
    setErros((atual) => ({ ...atual, [name]: '' }));
    setSucesso('');
  }

  async function aoSalvar(evento) {
    evento.preventDefault();
    const novosErros = {
      quantidadeKg: !(kg > 0)
        ? 'Informe quantos kg você vendeu.'
        : kg > estoque
          ? `Você só tem ${formatarKg(estoque)} no estoque deste plantio.`
          : '',
      precoKg: erroDoDinheiro(form.precoKg, 'o preço do kg'),
      canal: form.canal ? '' : 'Escolha onde você vendeu.',
      data: !form.data
        ? 'Informe a data.'
        : form.data > hoje
          ? 'A data não pode estar no futuro.'
          : form.data < dataColheita
            ? 'A venda não pode ser antes da colheita.'
            : '',
    };
    setErros(novosErros);
    if (Object.values(novosErros).some(Boolean)) return;

    setSalvando(true);
    setErroGeral('');
    try {
      const atualizado = await anotarVenda(id, {
        quantidadeKg: kg,
        precoKg: preco,
        canal: form.canal,
        data: form.data,
      });
      setFinancas(atualizado);
      setForm(formVazio);
      setSucesso(`Venda de ${formatarReais(kg * preco)} anotada.`);
    } catch (e) {
      if (e.campos) setErros(e.campos);
      else setErroGeral(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function aoApagar(venda) {
    const texto = `${formatarKg(venda.quantidadeKg)} · ${rotuloCanal(venda.canal)}`;
    if (!window.confirm(`Apagar a venda "${texto}"? Os kg voltam para o estoque.`)) return;
    setErroGeral('');
    setSucesso('');
    try {
      setFinancas(await apagarVenda(id, venda.id));
      setSucesso('Venda apagada. Os kg voltaram para o estoque.');
    } catch (e) {
      setErroGeral(e.message);
    }
  }

  return (
    <Layout cabecalho={cabecalho}>
      <div>
        <h1 className="titulo">Registrar venda</h1>
        <p className="texto-apoio">
          {plantio.especie}
          {dataColheita ? ` · ${formatarKg(estoque)} no estoque` : ''}
        </p>
      </div>

      {!dataColheita ? (
        <section className="cartao">
          <h2 className="subtitulo">Primeiro, registre a colheita</h2>
          <p className="texto-apoio">
            A venda sai do que você colheu. Registre a colheita (data e quilos) no calendário do
            plantio e depois volte aqui.
          </p>
          <Link to={`/plantios/${id}/calendario`} state={{ plantio }} className="botao botao--primario">
            <Icone nome="cesta" tamanho={20} /> Ir para o calendário
          </Link>
        </section>
      ) : estoque <= 0 ? (
        <Aviso tipo="info">Tudo o que você colheu já foi vendido. Não há mais kg no estoque.</Aviso>
      ) : (
        <form className="cartao formulario" onSubmit={aoSalvar} noValidate>
          <div className="financas__campos">
            <Campo id="quantidadeKg" rotulo="Quantos kg?" dica={`Até ${formatarKg(estoque)}`} erro={erros.quantidadeKg}>
              <input id="quantidadeKg" name="quantidadeKg" type="text" inputMode="decimal" placeholder="0" value={form.quantidadeKg} onChange={aoDigitar} />
            </Campo>
            <Campo id="precoKg" rotulo="Preço do kg (R$)" erro={erros.precoKg}>
              <input id="precoKg" name="precoKg" type="text" inputMode="decimal" placeholder="0,00" value={form.precoKg} onChange={aoDigitar} />
            </Campo>
          </div>

          <fieldset className="opcoes">
            <legend className="campo__rotulo">Onde vendeu?</legend>
            <div className="opcoes__grupo">
              {CANAIS_VENDA.map((c) => (
                <label key={c.valor} className={`opcao ${form.canal === c.valor ? 'opcao--ativa' : ''}`}>
                  <input type="radio" name="canal" value={c.valor} checked={form.canal === c.valor} onChange={aoDigitar} />
                  {c.rotulo}
                </label>
              ))}
            </div>
            {erros.canal && <p className="campo__erro" role="alert">✕ {erros.canal}</p>}
          </fieldset>

          <Campo id="data" rotulo="Quando?" erro={erros.data}>
            <input id="data" name="data" type="date" min={dataColheita} max={hoje} value={form.data} onChange={aoDigitar} />
          </Campo>

          {temPrevia && (
            <div className={`financas__previa ${abaixoDoMinimo ? 'financas__previa--alerta' : ''}`} aria-live="polite">
              <div className="financas__linha-total">
                <span>Você vai receber</span>
                <strong className="financas__total">{formatarReais(kg * preco)}</strong>
              </div>
              {resumo.precoMinimoKg > 0 && (
                <p className="financas__previa-nota">
                  {abaixoDoMinimo
                    ? `Abaixo do seu preço mínimo (${formatarReais(resumo.precoMinimoKg)}/kg): você perde ${formatarReais(resumo.precoMinimoKg - preco)} em cada kg.`
                    : `Acima do seu preço mínimo (${formatarReais(resumo.precoMinimoKg)}/kg).`}
                </p>
              )}
            </div>
          )}

          <Aviso tipo="erro">{erroGeral}</Aviso>
          <button type="submit" className="botao botao--primario" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar venda'}
          </button>
        </form>
      )}
      <Aviso tipo="sucesso">{sucesso}</Aviso>

      {vendas.length > 0 && (
        <section className="cartao">
          <div className="financas__linha-total">
            <h2 className="subtitulo subtitulo--sem-margem">Vendas anotadas</h2>
            <strong className="financas__total">{formatarReais(resumo.receita)}</strong>
          </div>
          <ul className="financas__lista">
            {vendas.map((v) => (
              <li key={v.id} className="financas__item">
                <div className="financas__item-texto">
                  <p className="financas__item-titulo">
                    {formatarKg(v.quantidadeKg)} · {rotuloCanal(v.canal)}
                  </p>
                  <p className="texto-apoio">
                    {formatarData(v.data)} · {formatarReais(v.precoKg)}/kg
                  </p>
                </div>
                <strong>{formatarReais(v.quantidadeKg * v.precoKg)}</strong>
                <button
                  type="button"
                  className="financas__apagar"
                  onClick={() => aoApagar(v)}
                  aria-label={`Apagar venda de ${formatarKg(v.quantidadeKg)} em ${formatarData(v.data)}`}
                >
                  <Icone nome="lixeira" tamanho={18} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Layout>
  );
}
