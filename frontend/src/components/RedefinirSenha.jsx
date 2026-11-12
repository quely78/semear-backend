// =============================================================
// components/RedefinirSenha.jsx — Usado pela responsável, na lista
// de agricultoras, quando uma agricultora esqueceu a senha.
//
//   1. "Redefinir senha"  →  2. confirma  →  3. mostra a senha provisória
//
// A senha provisória aparece UMA vez: a responsável passa para a
// agricultora (de boca ou por WhatsApp). No próximo login, a agricultora
// cria uma senha nova.
// =============================================================
import { useState } from 'react';
import { redefinirSenhaAgricultora } from '../services/comunidadeService';
import { primeiroNome } from '../utils/formatadores';
import Aviso from './Aviso';
import Icone from './Icone';

export default function RedefinirSenha({ agricultora }) {
  const [etapa, setEtapa] = useState('fechado'); // fechado | confirmando | pronta
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [copiada, setCopiada] = useState(false);
  const nome = primeiroNome(agricultora.nome);

  async function gerar() {
    setEnviando(true);
    setErro('');
    try {
      const resposta = await redefinirSenhaAgricultora(agricultora.id);
      setSenha(resposta.senhaProvisoria);
      setEtapa('pronta');
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(senha);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 3000);
    } catch {
      // Sem acesso à área de transferência: a senha continua na tela para copiar à mão
    }
  }

  function fechar() {
    setEtapa('fechado');
    setSenha('');
    setErro('');
    setCopiada(false);
  }

  if (etapa === 'fechado') {
    return (
      <button type="button" className="botao-texto redefinir__abrir" onClick={() => setEtapa('confirmando')}>
        <Icone nome="chave" tamanho={16} /> Redefinir senha
      </button>
    );
  }

  if (etapa === 'confirmando') {
    return (
      <div className="redefinir" role="group" aria-label={`Redefinir a senha de ${agricultora.nome}`}>
        <p>
          Gerar uma <strong>senha provisória</strong> para {agricultora.nome}? A senha que ela usa
          hoje deixa de funcionar.
        </p>
        <Aviso tipo="erro">{erro}</Aviso>
        <div className="confirmacao__botoes">
          <button type="button" className="botao botao--secundario" onClick={fechar} disabled={enviando}>
            Cancelar
          </button>
          <button type="button" className="botao botao--primario" onClick={gerar} disabled={enviando}>
            {enviando ? 'Gerando...' : 'Gerar senha'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="redefinir redefinir--pronta" role="status">
      <p>Senha provisória de {nome}:</p>
      <div className="redefinir__senha">
        <code>{senha}</code>
        <button type="button" className="botao botao--pequeno botao--secundario" onClick={copiar}>
          {copiada ? 'Copiada' : 'Copiar'}
        </button>
      </div>
      <p className="texto-apoio">
        Passe essa senha para {nome}. Ela entra com o contato dela e essa senha, e o app pede para
        criar uma senha nova. Essa senha não vai aparecer de novo.
      </p>
      <button type="button" className="botao-texto" onClick={fechar}>
        Pronto, já passei
      </button>
    </div>
  );
}
