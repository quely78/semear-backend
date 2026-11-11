// =============================================================
// components/Cabecalho.jsx — Barra do topo das telas internas.
//
// Dois modos:
//   1) Telas principais (abas do menu):  Olá, Maria ........... [Sair]
//   2) Telas de detalhe (com "voltar"):  ‹ Plantios
//
// O título da tela fica só no conteúdo (h1), para não aparecer duas
// vezes. No modo "voltar", o botão diz PARA ONDE ele leva.
// =============================================================
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { primeiroNome } from '../utils/formatadores';
import Icone from './Icone';

export default function Cabecalho({ voltarPara, rotuloVoltar = 'voltar' }) {
  const navegar = useNavigate();
  const { usuario, sair } = useAuth();

  /** Sai da conta e volta para o login. */
  function aoSair() {
    sair();
    navegar('/login', { replace: true });
  }

  // Modo "voltar": só nas telas de detalhe (ex.: formulário de plantio)
  if (voltarPara) {
    return (
      <header className="cabecalho">
        <button
          type="button"
          className="botao-texto cabecalho__voltar"
          onClick={() => navegar(voltarPara)}
        >
          <Icone nome="voltar" tamanho={18} /> {rotuloVoltar}
        </button>
      </header>
    );
  }

  // Modo saudação: em todas as abas do menu, com o botão Sair sempre visível
  return (
    <header className="cabecalho">
      <p className="cabecalho__saudacao">
        Olá, <strong>{primeiroNome(usuario?.nome)}</strong>
      </p>
      <button type="button" className="botao-texto" onClick={aoSair}>
        <Icone nome="sair" tamanho={18} /> Sair
      </button>
    </header>
  );
}
