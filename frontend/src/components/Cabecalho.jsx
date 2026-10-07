// =============================================================
// components/Cabecalho.jsx — Barra do topo das telas internas.
//
// Dois modos (como no wireframe):
//   1) Com "voltar":  ‹ voltar ............ Título
//   2) Saudação:      Olá, Maria ........... [Sair]
// =============================================================
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { primeiroNome } from '../utils/formatadores';
import Icone from './Icone';

export default function Cabecalho({ titulo, voltarPara, saudacao = false }) {
  const navegar = useNavigate();
  const { usuario, sair } = useAuth();

  /** Sai da conta e volta para o login. */
  function aoSair() {
    sair();
    navegar('/login', { replace: true });
  }

  return (
    <header className="cabecalho">
      {saudacao ? (
        // Modo saudação (Tela 3)
        <p className="cabecalho__saudacao">
          Olá, <strong>{primeiroNome(usuario?.nome)}</strong>
        </p>
      ) : (
        // Modo voltar (Telas 4 a 8). Se "voltarPara" não vier, volta no histórico.
        <button
          type="button"
          className="botao-texto cabecalho__voltar"
          onClick={() => (voltarPara ? navegar(voltarPara) : navegar(-1))}
        >
          <Icone nome="voltar" tamanho={18} /> voltar
        </button>
      )}

      {/* Título à direita, ou botão Sair na tela com saudação */}
      {saudacao ? (
        <button type="button" className="botao-texto" onClick={aoSair}>
          <Icone nome="sair" tamanho={18} /> Sair
        </button>
      ) : (
        <span className="cabecalho__titulo">{titulo}</span>
      )}
    </header>
  );
}