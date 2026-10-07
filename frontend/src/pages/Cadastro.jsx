// =============================================================
// pages/Cadastro.jsx — Tela 01: Cadastro da agricultora (RF01).
// Campos: Nome, Comunidade, Contato (telefone/e-mail) e Senha.
// =============================================================
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Logo from '../components/Logo';
import { COMUNIDADES } from '../config/dados';
import { useAuth } from '../context/AuthContext';
import { cadastrar } from '../services/authService';
import {
  temErros,
  validarContato,
  validarObrigatorio,
  validarSenha,
} from '../utils/validacoes';

// Valores iniciais do formulário
const FORM_VAZIO = { nome: '', comunidadeId: '', contato: '', senha: '' };

export default function Cadastro() {
  const { usuario } = useAuth();
  const navegar = useNavigate();

  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Quem já está logada vai direto para a tela inicial
  if (usuario) return <Navigate to="/" replace />;

  /** Atualiza o campo e limpa o erro dele. */
  function aoDigitar(evento) {
    const { name, value } = evento.target;
    setForm((atual) => ({ ...atual, [name]: value }));
    setErros((atual) => ({ ...atual, [name]: '' }));
  }

  /** Valida todos os campos e devolve o objeto de erros. */
  function validar() {
    return {
      nome: validarObrigatorio(form.nome, 'Nome'),
      comunidadeId: form.comunidadeId ? '' : 'Escolha sua comunidade.',
      contato: validarContato(form.contato),
      senha: validarSenha(form.senha),
    };
  }

  /** Envia o cadastro para a API. */
  async function aoEnviar(evento) {
    evento.preventDefault();
    setErroGeral('');

    const novosErros = validar();
    setErros(novosErros);
    if (temErros(novosErros)) return;

    setEnviando(true);
    try {
      await cadastrar({
        nome: form.nome.trim(),
        contato: form.contato.trim(),
        senha: form.senha,
        comunidadeId: Number(form.comunidadeId), // a API espera número
      });
      // Deu certo: vai para o login com uma mensagem de boas-vindas
      navegar('/login', {
        replace: true,
        state: { mensagem: 'Conta criada! Agora é só entrar.' },
      });
    } catch (erro) {
      // Ex.: "Contato já cadastrado."
      setErroGeral(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela-acesso">
      <div className="tela-acesso__topo tela-acesso__topo--compacto">
        <Logo variante="horizontal" />
      </div>

      <form className="cartao formulario" onSubmit={aoEnviar} noValidate>
        <h1 className="titulo">Criar conta</h1>
        <Aviso tipo="erro">{erroGeral}</Aviso>

        <Campo id="nome" rotulo="Nome" erro={erros.nome}>
          <input
            id="nome"
            name="nome"
            type="text"
            autoComplete="name"
            placeholder="seu nome completo"
            value={form.nome}
            onChange={aoDigitar}
          />
        </Campo>

        <Campo id="comunidadeId" rotulo="Comunidade" erro={erros.comunidadeId}>
          <select
            id="comunidadeId"
            name="comunidadeId"
            value={form.comunidadeId}
            onChange={aoDigitar}
          >
            <option value="">Selecione sua comunidade</option>
            {COMUNIDADES.map((comunidade) => (
              <option key={comunidade.id} value={comunidade.id}>
                {comunidade.nome}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="contato" rotulo="Contato (telefone/e-mail)" erro={erros.contato}>
          <input
            id="contato"
            name="contato"
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="ex.: 92 99999-0000"
            value={form.contato}
            onChange={aoDigitar}
          />
        </Campo>

        <Campo
          id="senha"
          rotulo="Senha"
          dica="Mínimo de 6 caracteres"
          erro={erros.senha}
        >
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            placeholder="crie uma senha"
            value={form.senha}
            onChange={aoDigitar}
          />
        </Campo>

        <button className="botao botao--primario" type="submit" disabled={enviando}>
          {enviando ? 'Cadastrando...' : 'Cadastrar'}
        </button>

        <Link to="/login" className="botao-texto">
          Já tenho conta — fazer login
        </Link>
      </form>
    </div>
  );
}