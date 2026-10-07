// =============================================================
// pages/NaoEncontrada.jsx — Tela para endereços que não existem (404).
// =============================================================
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function NaoEncontrada() {
  return (
    <div className="tela-acesso">
      <div className="cartao formulario centralizado">
        <Logo variante="icone" className="logo--grande" />
        <h1 className="titulo">Página não encontrada</h1>
        <p className="texto-apoio">Esse caminho não existe por aqui.</p>
        <Link to="/" className="botao botao--primario">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}