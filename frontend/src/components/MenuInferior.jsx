// =============================================================
// components/MenuInferior.jsx — Barra de navegação fixa no rodapé
// (Plantios · Calendário · Comunidade), como no wireframe.
// Botões grandes e com texto: mais fácil para quem tem pouca
// familiaridade com tecnologia.
// =============================================================
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icone from './Icone';

export default function MenuInferior() {
  const { usuario } = useAuth();

  // A primeira aba muda conforme o perfil:
  // agricultora → seus plantios | coordenadora → painel dela
  const abaInicial =
    usuario?.tipo === 'COORDENADORA'
      ? { para: '/coordenadora', icone: 'broto', rotulo: 'Início' }
      : { para: '/plantios', icone: 'broto', rotulo: 'Plantios' };

  const abas = [
    abaInicial,
    { para: '/calendario', icone: 'calendario', rotulo: 'Calendário' },
    { para: '/comunidade', icone: 'comunidade', rotulo: 'Comunidade' },
  ];

  return (
    <nav className="menu-inferior" aria-label="Navegação principal">
      {abas.map((aba) => (
        // NavLink adiciona a classe "active" na aba da tela atual
        <NavLink key={aba.para} to={aba.para} className="menu-inferior__item">
          <Icone nome={aba.icone} />
          <span>{aba.rotulo}</span>
        </NavLink>
      ))}
    </nav>
  );
}