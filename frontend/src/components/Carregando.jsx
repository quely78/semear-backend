// =============================================================
// components/Carregando.jsx — Indicador de "carregando".
// Importante em internet lenta: a usuária sabe que o app está trabalhando.
// =============================================================
export default function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="carregando" role="status">
      {/* Bolinha girando (animação no CSS) */}
      <span className="carregando__giro" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}