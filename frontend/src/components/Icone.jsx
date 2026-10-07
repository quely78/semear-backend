// =============================================================
// components/Icone.jsx — Ícones desenhados em SVG (sem biblioteca extra,
// para o app ficar leve em internet lenta).
//
// Uso: <Icone nome="broto" />
// =============================================================

// Cada ícone é o "desenho" (caminhos SVG) em uma grade de 24x24
const DESENHOS = {
  // Broto: aba "Plantios"
  broto: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6Z" />
      <path d="M12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z" />
      <path d="M5 21h14" />
    </>
  ),
  // Calendário: aba "Calendário"
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  // Pessoas: aba "Comunidade"
  comunidade: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M15 14.3c2.6-.4 4.8 1.2 5.5 4.2" />
    </>
  ),
  mais: <path d="M12 5v14M5 12h14" />,
  voltar: <path d="M15 5l-7 7 7 7" />,
  sair: (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 8l-4 4 4 4M6 12h10" />
    </>
  ),
  lixeira: (
    <>
      <path d="M4 7h16M9 7V4.5h6V7" />
      <path d="M6.5 7l1 13h9l1-13" />
    </>
  ),
  busca: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alerta: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5M12 16.2v.3" />
    </>
  ),
};

export default function Icone({ nome, tamanho = 22, className = '' }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor" // herda a cor do texto ao redor
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true" // decorativo: o texto ao lado já explica
    >
      {DESENHOS[nome]}
    </svg>
  );
}