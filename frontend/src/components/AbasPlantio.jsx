// =============================================================
// components/AbasPlantio.jsx — Abas no topo de um plantio:
//   [ Calendário | Dinheiro ]
// Cada aba é uma tela (/plantios/:id/calendario e /plantios/:id/dinheiro).
// =============================================================
import { Link } from 'react-router-dom';

export default function AbasPlantio({ plantio, ativa, voltar }) {
  const abas = [
    { chave: 'calendario', rotulo: 'Calendário' },
    { chave: 'dinheiro', rotulo: 'Dinheiro' },
  ];

  return (
    <nav className="alternador" aria-label="Partes do plantio">
      {abas.map((aba) => (
        <Link
          key={aba.chave}
          to={`/plantios/${plantio.id}/${aba.chave}`}
          // Leva o plantio junto: a outra aba abre sem esperar a API
          state={{ plantio, voltar }}
          replace
          className={`alternador__opcao alternador__opcao--link ${
            ativa === aba.chave ? 'alternador__opcao--ativa' : ''
          }`}
          aria-current={ativa === aba.chave ? 'page' : undefined}
        >
          {aba.rotulo}
        </Link>
      ))}
    </nav>
  );
}
