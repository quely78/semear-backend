// =============================================================
// pages/EsqueciSenha.jsx — "Esqueci minha senha".  /esqueci-senha
//
//   Conta com e-mail ...... enviamos um link para criar uma senha nova
//   Conta com telefone .... a responsável pela comunidade gera uma
//                           senha provisória (não há envio de SMS)
// =============================================================
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Icone from '../components/Icone';
import Logo from '../components/Logo';
import { pedirLinkPorEmail } from '../services/authService';
import { validarContato } from '../utils/validacoes';

const ehEmail = (texto) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);

export default function EsqueciSenha() {
  const local = useLocation();
  // O login manda o contato que já estava digitado, para não digitar de novo
  const [contato, setContato] = useState(local.state?.contato || '');
  const [erro, setErro] = useState('');
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // 'email' | 'telefone'

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErroGeral('');
    const texto = contato.trim();
    const problema = validarContato(texto);
    if (problema) {
      setErro(problema);
      return;
    }

    // Telefone: não há como mandar o link, o caminho é a responsável
    if (!ehEmail(texto)) {
      setResultado('telefone');
      return;
    }

    setEnviando(true);
    try {
      await pedirLinkPorEmail(texto);
      setResultado('email');
    } catch (e) {
      if (e.campos?.contato) setErro(e.campos.contato);
      else setErroGeral(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela-acesso">
      <div className="tela-acesso__topo tela-acesso__topo--compacto">
        <Logo variante="horizontal" />
      </div>

      <div className="cartao formulario">
        <h1 className="titulo">Esqueci minha senha</h1>

        {resultado === 'email' && (
          <>
            <Aviso tipo="sucesso">
              Se esse e-mail tiver uma conta no SemeAR, enviamos um link para criar uma senha nova.
            </Aviso>
            <ol className="passos">
              <li>Abra o e-mail <strong>{contato.trim()}</strong>.</li>
              <li>Toque em <strong>Criar senha nova</strong>. O link vale por 30 minutos.</li>
              <li>Não chegou em alguns minutos? Olhe a caixa de spam ou peça de novo.</li>
            </ol>
            <button type="button" className="botao botao--secundario" onClick={() => setResultado(null)}>
              Pedir de novo
            </button>
          </>
        )}

        {resultado === 'telefone' && (
          <>
            <Aviso tipo="info">
              Para contas com telefone, quem ajuda é a responsável pela sua comunidade.
            </Aviso>
            <ol className="passos">
              <li>Peça para ela gerar uma <strong>senha provisória</strong> para você no SemeAR.</li>
              <li>Entre com seu telefone e essa senha provisória.</li>
              <li>O app vai pedir para você criar uma senha nova, só sua.</li>
            </ol>
            <button type="button" className="botao botao--secundario" onClick={() => setResultado(null)}>
              Usar outro contato
            </button>
          </>
        )}

        {!resultado && (
          <form className="formulario" onSubmit={aoEnviar} noValidate>
            <p className="texto-apoio">
              Digite o telefone ou e-mail que você usa para entrar. Se for e-mail, mandamos um link
              para você criar uma senha nova.
            </p>
            <Aviso tipo="erro">{erroGeral}</Aviso>
            <Campo id="contato" rotulo="Contato (telefone ou e-mail)" erro={erro}>
              <input
                id="contato"
                name="contato"
                type="text"
                autoComplete="username"
                placeholder="ex.: maria@email.com"
                value={contato}
                onChange={(e) => {
                  setContato(e.target.value);
                  setErro('');
                }}
              />
            </Campo>
            <button className="botao botao--primario" type="submit" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Continuar'}
            </button>
          </form>
        )}

        <Link to="/login" className="botao-texto">
          <Icone nome="voltar" tamanho={16} /> Voltar para o login
        </Link>
      </div>
    </div>
  );
}
