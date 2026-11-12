// =============================================================
// pages/CriarSenhaNova.jsx — Aberta pelo link do e-mail de
// "esqueci minha senha".  /redefinir-senha?token=...
//
// Confere o link ao abrir: se expirou ou já foi usado, avisa logo,
// antes de a pessoa digitar a senha nova.
// =============================================================
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Carregando from '../components/Carregando';
import Logo from '../components/Logo';
import { criarSenhaPeloLink, validarLinkDeSenha } from '../services/authService';
import { temErros, validarSenha } from '../utils/validacoes';

export default function CriarSenhaNova() {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') || '';
  const navegar = useNavigate();

  const [estadoLink, setEstadoLink] = useState('conferindo'); // conferindo | valido | invalido
  const [mensagemLink, setMensagemLink] = useState('');
  const [form, setForm] = useState({ novaSenha: '', confirmacao: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    validarLinkDeSenha(token)
      .then(() => setEstadoLink('valido'))
      .catch((e) => {
        setMensagemLink(e.message);
        setEstadoLink('invalido');
      });
  }, [token]);

  function aoDigitar(evento) {
    const { name, value } = evento.target;
    setForm((atual) => ({ ...atual, [name]: value }));
    setErros((atual) => ({ ...atual, [name]: '' }));
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErroGeral('');
    const novosErros = {
      novaSenha: validarSenha(form.novaSenha),
      confirmacao:
        form.confirmacao === form.novaSenha ? '' : 'As duas senhas novas precisam ser iguais.',
    };
    setErros(novosErros);
    if (temErros(novosErros)) return;

    setEnviando(true);
    try {
      await criarSenhaPeloLink(token, form.novaSenha);
      navegar('/login', {
        replace: true,
        state: { mensagem: 'Senha nova criada! Agora é só entrar.' },
      });
    } catch (e) {
      if (e.campos) setErros((atuais) => ({ ...atuais, ...e.campos }));
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
        <h1 className="titulo">Criar senha nova</h1>

        {estadoLink === 'conferindo' && <Carregando texto="Conferindo o link..." />}

        {estadoLink === 'invalido' && (
          <>
            <Aviso tipo="erro">{mensagemLink}</Aviso>
            <Link to="/esqueci-senha" className="botao botao--primario">
              Pedir um link novo
            </Link>
          </>
        )}

        {estadoLink === 'valido' && (
          <form className="formulario" onSubmit={aoEnviar} noValidate>
            <Aviso tipo="erro">{erroGeral}</Aviso>
            <Campo id="novaSenha" rotulo="Senha nova" dica="Mínimo de 6 caracteres" erro={erros.novaSenha}>
              <input
                id="novaSenha"
                name="novaSenha"
                type="password"
                autoComplete="new-password"
                value={form.novaSenha}
                onChange={aoDigitar}
              />
            </Campo>
            <Campo id="confirmacao" rotulo="Repita a senha nova" erro={erros.confirmacao}>
              <input
                id="confirmacao"
                name="confirmacao"
                type="password"
                autoComplete="new-password"
                value={form.confirmacao}
                onChange={aoDigitar}
              />
            </Campo>
            <button className="botao botao--primario" type="submit" disabled={enviando}>
              {enviando ? 'Salvando...' : 'Salvar senha nova'}
            </button>
          </form>
        )}

        <Link to="/login" className="botao-texto">
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
