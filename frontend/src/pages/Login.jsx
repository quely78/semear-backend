// =============================================================
// pages/Login.jsx — Tela 02: Login (RF02).
// Campos: contato e senha. Botões: Entrar e Criar nova conta.
// =============================================================
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';import { temErros, validarObrigatorio } from '../utils/validacoes';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();

  // Estado do formulário
  const [form, setForm] = useState({ contato: '', senha: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Mensagem enviada pela tela de cadastro ("Conta criada...")
  const mensagemCadastro = local.state?.mensagem;

  // Se já estiver logada, não faz sentido ver o login
  if (usuario) return <Navigate to="/" replace />;

  /** Atualiza o campo digitado e apaga o erro dele. */
  function aoDigitar(evento) {
    const { name, value } = evento.target;
    setForm((atual) => ({ ...atual, [name]: value }));
    setErros((atual) => ({ ...atual, [name]: '' }));
  }

  /** Envia o login. */
  async function aoEnviar(evento) {
    evento.preventDefault(); // impede o navegador de recarregar a página
    setErroGeral('');

    // 1) Valida no próprio navegador (resposta imediata, sem gastar internet)
    const novosErros = {
      contato: validarObrigatorio(form.contato, 'Contato'),
      senha: validarObrigatorio(form.senha, 'Senha'),
    };
    setErros(novosErros);
    if (temErros(novosErros)) return;

    // 2) Envia para a API
    setEnviando(true);
    try {
      const logada = await entrar(form.contato.trim(), form.senha);
      // Volta para a tela que ela tentou abrir antes, ou para a inicial
      const destino =
        local.state?.de || (logada.tipo === 'COORDENADORA' ? '/coordenadora' : '/plantios');
      navegar(destino, { replace: true });
    } catch (erro) {
      setErroGeral(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela-acesso">
      <div className="tela-acesso__topo">
        <Logo variante="vertical" />
        <p className="tela-acesso__slogan">
          O registro do plantio, feito por <span className="destaque-elas">ELAS</span>
        </p>
      </div>

      <form className="cartao formulario" onSubmit={aoEnviar} noValidate>
        <h1 className="titulo">Entrar</h1>

        <Aviso tipo="sucesso">{mensagemCadastro}</Aviso>
        <Aviso tipo="erro">{erroGeral}</Aviso>

        <Campo id="contato" rotulo="Contato (telefone ou e-mail)" erro={erros.contato}>
          <input
            id="contato"
            name="contato"
            type="text"
            autoComplete="username"
            placeholder="ex.: 92 99999-0000"
            value={form.contato}
            onChange={aoDigitar}
          />
        </Campo>

        <Campo id="senha" rotulo="Senha" erro={erros.senha}>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            placeholder="sua senha"
            value={form.senha}
            onChange={aoDigitar}
          />
        </Campo>

        <button className="botao botao--primario" type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>

        <Link to="/cadastro" className="botao botao--secundario">
          Criar nova conta
        </Link>

        {/* Recuperação de senha: por e-mail (link) ou, para telefone, pela responsável
            (senha provisória). A tela /esqueci-senha explica cada caminho. */}
        <Link to="/esqueci-senha" state={{ contato: form.contato }} className="botao-texto">
          Esqueci minha senha
        </Link>
      </form>
    </div>
  );
}
