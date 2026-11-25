// Filtro de período dos painéis (fica no topo e vale para tudo abaixo dele):
//   [ Últimos 12 meses ] [ 2026 ] [ 2025 ]
import { opcoesDePeriodo } from '../../utils/graficos';

export default function FiltroPeriodo({ valor, aoMudar }) {
  return (
    <div className="seletor-ano" role="group" aria-label="Período dos números">
      {opcoesDePeriodo().map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          className={`seletor-ano__opcao ${valor === opcao.valor ? 'seletor-ano__opcao--ativa' : ''}`}
          aria-pressed={valor === opcao.valor}
          onClick={() => aoMudar(opcao.valor)}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
