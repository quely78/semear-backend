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
  // Casa: aba "Início" da responsável pela comunidade
  casa: (
    <>
      <path d="M4 11l8-6.5 8 6.5" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  // Gráfico de barras: aba "Comunidade" (painel com os números)
  grafico: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-6M12 20V8M17 20v-9" />
    </>
  ),
  // Nuvem com chuva: períodos de chuva no calendário do plantio
  chuva: (
    <>
      <path d="M7 15a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 17 8a3.5 3.5 0 0 1 .5 7H7Z" />
      <path d="M8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5" />
    </>
  ),
  lapis: (
    <>
      <path d="M4 20l1-4.5L15.5 5a2 2 0 0 1 3 3L8 18.5 4 20Z" />
      <path d="M13.5 7l3 3" />
    </>
  ),
  avancar: <path d="M9 5l7 7-7 7" />,
  // Pessoa: perfil
  pessoa: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-6 7-6s6.2 2.4 7 6" />
    </>
  ),
  // Chave: redefinir senha
  chave: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l8.5-8.5M16 7l2.5 2.5M14 9l2 2" />
    </>
  ),
  // Cesta: registrar colheita
  cesta: (
    <>
      <path d="M3.5 10h17l-1.8 9H5.3L3.5 10Z" />
      <path d="M8 10l3-5.5M16 10l-3-5.5M9.5 14v2.5M14.5 14v2.5" />
    </>
  ),
  // Caixa: aba "Estoque"
  estoque: (
    <>
      <path d="M3.5 8l8.5-4 8.5 4v8.5L12 20.5l-8.5-4V8Z" />
      <path d="M3.5 8L12 12l8.5-4M12 12v8.5" />
    </>
  ),
  // Seta para baixo: baixar/exportar
  baixar: (
    <>
      <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" />
      <path d="M5 19.5h14" />
    </>
  ),
  // Seta subindo / descendo: entrada e saída do estoque
  entrada: <path d="M12 19V6M6.5 11.5L12 6l5.5 5.5" />,
  saida: <path d="M12 5v13M6.5 12.5L12 18l5.5-5.5" />,
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
  olho: (
    <>
      <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  'olho-fechado': (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.9A10.7 10.7 0 0 1 12 6.8c6 0 9.5 5.2 9.5 5.2a17.7 17.7 0 0 1-3.1 3.3" />
      <path d="M6.7 6.8C3.9 8.3 2.5 12 2.5 12s3.5 5.2 9.5 5.2c1 0 1.9-.2 2.7-.4" />
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
