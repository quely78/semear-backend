// =============================================================
// components/graficos/Indicador.jsx — Cartão de número do painel.
//   rotulo ......... "Colhido"
//   valor .......... "620 kg"
//   detalhe ........ "de 1.250 m² colhidos" (opcional)
//   variacao ....... 0.12 → "▲ 12% vs período anterior" (opcional)
//   tendencia ...... números por mês → mini-gráfico (opcional)
//   alerta ......... true → cartão de atenção (ícone + texto, não só cor)
//   para ........... link (o cartão inteiro vira link)
// =============================================================
import { Link } from 'react-router-dom';
import Icone from '../Icone';
import Sparkline from './Sparkline';

const temVariacao = (valor) => valor !== null && valor !== undefined && Number.isFinite(valor);

function Variacao({ valor, subirEhBom = true, rotulo }) {
  if (!temVariacao(valor)) return null;
  const subiu = valor > 0;
  const igual = Math.abs(valor) < 0.005;
  const bom = igual ? null : subiu === subirEhBom;
  return (
    <span className={`indicador-painel__variacao ${bom === null ? '' : bom ? 'indicador-painel__variacao--boa' : 'indicador-painel__variacao--ruim'}`}>
      {igual ? '=' : subiu ? '▲' : '▼'} {Math.abs(Math.round(valor * 100))}%{' '}
      <span className="indicador-painel__comparacao">{rotulo}</span>
    </span>
  );
}

export default function Indicador({
  rotulo,
  valor,
  detalhe,
  variacao,
  rotuloVariacao = 'vs período anterior',
  subirEhBom,
  tendencia,
  alerta,
  para,
}) {
  const conteudo = (
    <>
      <span className="indicador-painel__rotulo">
        {alerta && <Icone nome="alerta" tamanho={16} />}
        {rotulo}
      </span>
      <strong className="indicador-painel__valor">{valor}</strong>
      {(detalhe || temVariacao(variacao)) && (
        <span className="indicador-painel__detalhe">
          {temVariacao(variacao) ? (
            <Variacao valor={variacao} subirEhBom={subirEhBom} rotulo={rotuloVariacao} />
          ) : (
            detalhe
          )}
        </span>
      )}
      {tendencia && tendencia.length > 1 && <Sparkline valores={tendencia} />}
    </>
  );
  const classe = `indicador-painel ${alerta ? 'indicador-painel--alerta' : ''} ${para ? 'indicador-painel--link' : ''}`;
  return para ? (
    <Link to={para} className={classe}>
      {conteudo}
    </Link>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}
