// =============================================================
// components/MenuInferior.jsx — Barra de navegação fixa no rodapé.
// Botões grandes e com texto: mais fácil para quem tem pouca
// familiaridade com tecnologia.
//
// As abas mudam conforme o perfil:
//   Agricultora ................. Plantios · Calendário · Comunidade
//   Responsável pela comunidade . Início · Agricultoras · Comunidade
// =============================================================
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icone from './Icone';

// Abas de cada perfil
// Cada tela tem SEMPRE o mesmo nome e o mesmo ícone, nos dois perfis.
const ABAS_AGRICULTORA = [
  { para: '/plantios', icone: 'broto', rotulo: 'Plantios' },
  { para: '/calendario', icone: 'calendario', rotulo: 'Calendário' },
  { para: '/comunidade', icone: 'grafico', rotulo: 'Comunidade' },
];

const ABAS_RESPONSAVEL = [
  { para: '/coordenadora', icone: 'casa', rotulo: 'Início', exato: true },
  { para: '/coordenadora/agricultoras', icone: 'comunidade', rotulo: 'Agricultoras' },
  { para: '/comunidade', icone: 'grafico', rotulo: 'Comunidade' },
];

export default function MenuInferior() {
  const { usuario } = useAuth();
  const abas = usuario?.tipo === 'COORDENADORA' ? ABAS_RESPONSAVEL : ABAS_AGRICULTORA;

  return (
    <nav className="menu-inferior" aria-label="Navegação principal">
      {abas.map((aba) => (
        // NavLink adiciona a classe "active" na aba da tela atual.
        // "end" faz "Início" (/coordenadora) não ficar ativo em /coordenadora/agricultoras.
        // A aba "Plantios" continua acesa dentro do calendário de um plantio.
        <NavLink key={aba.para} to={aba.para} end={aba.exato} className="menu-inferior__item">
          <Icone nome={aba.icone} />
          <span>{aba.rotulo}</span>
        </NavLink>
      ))}
    </nav>
  );
}
