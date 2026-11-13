// =============================================================
// components/SeletorAno.jsx — Escolha do período dos resumos:
//   [ 2025 ] [ 2026 ] [ Tudo ]
// valor: "2026" | "2025" | "tudo"
// =============================================================

/** "2026" → { dataInicio: "2026-01-01", dataFim: "2026-12-31" }; "tudo" → {} */
export function periodoDoAno(valor) {
  if (valor === 'tudo') return {};
  return { dataInicio: `${valor}-01-01`, dataFim: `${valor}-12-31` };
}

export const anoAtual = () => String(new Date().getFullYear());

export default function SeletorAno({ valor, aoMudar }) {
  const ano = Number(anoAtual());
  const opcoes = [
    { valor: String(ano - 1), rotulo: String(ano - 1) },
    { valor: String(ano), rotulo: String(ano) },
    { valor: 'tudo', rotulo: 'Tudo' },
  ];

  return (
    <div className="seletor-ano" role="group" aria-label="Período">
      {opcoes.map((opcao) => (
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
