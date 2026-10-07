// =============================================================
// components/Logo.jsx — Logo do SemeAR (arquivos em /public).
//
// variante:
//   "vertical"   → telas de abertura (login/cadastro)
//   "horizontal" → cabeçalhos
//   "icone"      → só o símbolo
// =============================================================
const ARQUIVOS = {
  vertical: '/logo-vertical.png',
  horizontal: '/logo-horizontal.png',
  icone: '/icone.png',
};

export default function Logo({ variante = 'horizontal', className = '' }) {
  return (
    <img
      src={ARQUIVOS[variante]}
      // Texto alternativo para leitores de tela
      alt="SemeAR"
      className={`logo logo--${variante} ${className}`}
    />
  );
}