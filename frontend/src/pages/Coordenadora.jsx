// =============================================================
// pages/Coordenadora.jsx — Tela 08: Área da coordenadora.
//
// Na v1, a ÚNICA ação oficialmente prevista para este perfil é
// "Visualizar dashboard". As outras aparecem desativadas com a
// etiqueta "sugestão — fora da v1", como no wireframe.
// =============================================================
import { Link } from 'react-router-dom';
import Icone from '../components/Icone';
import Layout from '../components/Layout';

export default function Coordenadora() {
  return (
    // Cabeçalho com saudação ("Olá, Nome") e botão Sair
    <Layout cabecalho={{ saudacao: true }}>
      <h1 className="titulo">Área da coordenadora</h1>
      <p className="texto-apoio">Acompanhe o trabalho da sua comunidade.</p>

      {/* Ação oficial da v1 */}
      <Link to="/comunidade" className="botao botao--primario">
        <Icone nome="comunidade" tamanho={20} /> Visualizar dashboard
      </Link>

      <hr className="divisor" />

      {/* Sugestões para versões futuras (desativadas) */}
      <div className="acao-futura">
        <span className="etiqueta">sugestão — fora da v1</span>
        <button type="button" className="botao botao--secundario" disabled>
          Listar agricultoras
        </button>
      </div>
      <div className="acao-futura">
        <span className="etiqueta">sugestão — fora da v1</span>
        <button type="button" className="botao botao--secundario" disabled>
          Exportar relatório
        </button>
      </div>
    </Layout>
  );
}