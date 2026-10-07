// =============================================================
// components/Aviso.jsx — Faixa de mensagem (erro, sucesso ou informação).
//
// tipo: "erro" | "sucesso" | "info"
// Ex.: <Aviso tipo="sucesso">Plantio salvo com sucesso</Aviso>
// =============================================================
import Icone from './Icone';

const ICONES = { erro: 'alerta', sucesso: 'check', info: 'alerta' };

export default function Aviso({ tipo = 'info', children }) {
  if (!children) return null; // sem texto, não mostra nada

  return (
    // role="status" / "alert" avisa leitores de tela sobre a mensagem
    <div className={`aviso aviso--${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <Icone nome={ICONES[tipo]} tamanho={18} />
      <span>{children}</span>
    </div>
  );
}