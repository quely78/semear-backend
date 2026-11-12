// =============================================================
// pages/Cadastro.jsx — Tela 01: Cadastro (RF01).
//
// Dois perfis:
//   - Agricultora ............ registra os próprios plantios
//   - Responsável pela comunidade (no banco: COORDENADORA)
//                              acompanha a comunidade que ela cuida
//
// Campos: Perfil, Nome, Comunidade, Contato (telefone/e-mail) e Senha.
// =============================================================
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Icone from '../components/Icone';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { cadastrar } from '../services/authService';
import { listarComunidades } from '../services/comunidadeService';
import {
  temErros,
  validarContato,
  validarObrigatorio,
  validarSenha,
} from '../utils/validacoes';

// Opções de perfil mostradas no topo do formulário.
// "valor" é o que vai para a API; o resto é só para a tela.
const PERFIS = [
  {
    valor: 'AGRICULTORA',
    icone: 'broto',
    titulo: 'Sou agricultora',
    descricao: 'Quero registrar meus plantios',
  },
  {
    valor: 'COORDENADORA',
    icone: 'comunidade',
    titulo: 'Cuido de uma comunidade',
    descricao: 'Quero acompanhar as agricultoras',
  },
];

// Valores iniciais do formulário (agricultora vem marcada por padrão)
const FORM_VAZIO = { tipo: 'AGRICULTORA', nome: '', comunidadeId: '', contato: '', senha: '' };

export default function Cadastro() {
  const { usuario } = useAuth();
  const navegar = useNavigate();

  const [form, setForm] = useState(FORM_VAZIO);
  const [comunidades, setComunidades] = useState([]);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Carrega a lista de comunidades ao abrir a tela
  useEffect(() => {
    listarComunidades().then(setComunidades);
  }, []);

  // Quem já está logada vai direto para a tela inicial
  if (usuario) return <Navigate to="/" replace />;

  const responsavel = form.tipo === 'COORDENADORA';

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
      comunidadeId: form.comunidadeId
        ? ''
        : responsavel
          ? 'Escolha a comunidade que você cuida.'
          : 'Escolha sua comunidade.',
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
        tipo: form.tipo,
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
      // Se a API apontar o campo com problema, o erro aparece embaixo dele;
      // senão (ex.: sem internet), aparece no aviso geral do formulário
      const camposDaTela = ['nome', 'comunidadeId', 'contato', 'senha'];
      if (erro.campos) setErros((atuais) => ({ ...atuais, ...erro.campos }));
      if (!erro.campos || Object.keys(erro.campos).some((c) => !camposDaTela.includes(c))) {
        setErroGeral(erro.message);
      }
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

        {/* Escolha do perfil: dois cartões grandes, fáceis de tocar */}
        <fieldset className="perfis">
          <legend className="campo__rotulo">Como você vai usar o SemeAR?</legend>
          <div className="perfis__grupo">
            {PERFIS.map((perfil) => (
              <label
                key={perfil.valor}
                className={`perfil ${form.tipo === perfil.valor ? 'perfil--ativo' : ''}`}
              >
                {/* O botão de opção fica escondido; o cartão inteiro é clicável */}
                <input
                  type="radio"
                  name="tipo"
                  value={perfil.valor}
                  checked={form.tipo === perfil.valor}
                  onChange={aoDigitar}
                  className="sr-only"
                />
                <Icone nome={perfil.icone} tamanho={26} />
                <strong>{perfil.titulo}</strong>
                <span>{perfil.descricao}</span>
              </label>
            ))}
          </div>
        </fieldset>

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

        {/* O texto muda conforme o perfil escolhido */}
        <Campo
          id="comunidadeId"
          rotulo={responsavel ? 'Comunidade que você cuida' : 'Comunidade'}
          dica={responsavel ? 'Cada comunidade tem uma única responsável' : ''}
          erro={erros.comunidadeId}
        >
          <select
            id="comunidadeId"
            name="comunidadeId"
            value={form.comunidadeId}
            onChange={aoDigitar}
          >
            <option value="">Selecione a comunidade</option>
            {comunidades.map((comunidade) => (
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
            autoComplete="username"
            placeholder="ex.: 92 99999-0000"
            value={form.contato}
            onChange={aoDigitar}
          />
        </Campo>

        <Campo id="senha" rotulo="Senha" dica="Mínimo de 6 caracteres" erro={erros.senha}>
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
