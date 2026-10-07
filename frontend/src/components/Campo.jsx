// =============================================================
// components/Campo.jsx — Campo de formulário com rótulo, dica e erro.
//
// Mostra (de cima para baixo): rótulo → campo → dica OU erro.
// Quando há erro, a borda fica rosa e aparece "✕ mensagem" (Tela 7).
//
// Uso:
//   <Campo id="nome" rotulo="Nome" erro={erros.nome}>
//     <input id="nome" ... />
//   </Campo>
// =============================================================
export default function Campo({ id, rotulo, dica, erro, children }) {
  return (
    <div className={`campo ${erro ? 'campo--erro' : ''}`}>
      {/* htmlFor liga o rótulo ao campo: tocar no texto foca o campo */}
      <label htmlFor={id} className="campo__rotulo">
        {rotulo}
      </label>

      {children}

      {/* Erro tem prioridade sobre a dica. role="alert" faz leitores de tela anunciarem. */}
      {erro ? (
        <p className="campo__erro" role="alert" id={`${id}-erro`}>
          ✕ {erro}
        </p>
      ) : (
        dica && <p className="campo__dica">{dica}</p>
      )}
    </div>
  );
}