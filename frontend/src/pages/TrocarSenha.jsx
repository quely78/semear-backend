// =============================================================
// pages/TrocarSenha.jsx — Criar uma senha nova.  /trocar-senha
//
// Aparece sozinha depois que a agricultora entra com a SENHA PROVISÓRIA
// que a responsável gerou (o app não deixa ir para outra tela antes).
// Também pode ser aberta por quem só quer trocar a própria senha.
// =============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { temErros, validarSenha } from '../utils/validacoes';

export default function TrocarSenha() {
  const { usuario, trocarSenha, sair } = useAuth();
  const navegar = useNavigate();
  const provisoria = Boolean(usuario?.trocarSenha);
  const inicio = usuario?.tipo === 'COORDENADORA' ? '/coordenadora' : '/plantios';

  const [form, setForm] = useState({ senhaAtual: '', novaSenha: '', confirmacao: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  function aoDigitar(evento) {
    const { name, value } = evento.target;
    setForm((atual) => ({ ...atual, [name]: value }));
    setErros((atual) => ({ ...atual, [name]: '' }));
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    setErroGeral('');

    const novosErros = {
      senhaAtual: form.senhaAtual
        ? ''
        : provisoria
          ? 'Digite a senha provisória que você recebeu.'
          : 'Digite sua senha atual.',
      novaSenha: validarSenha(form.novaSenha),
      confirmacao:
        form.confirmacao === form.novaSenha ? '' : 'As duas senhas novas precisam ser iguais.',
    };
    if (!novosErros.novaSenha && form.novaSenha === form.senhaAtual) {
      novosErros.novaSenha = 'A senha nova precisa ser diferente da atual.';
    }
    setErros(novosErros);
    if (temErros(novosErros)) return;

    setEnviando(true);
    try {
      await trocarSenha(form.senhaAtual, form.novaSenha);
      navegar(inicio, { replace: true, state: { mensagem: 'Senha nova criada.' } });
    } catch (erro) {
      // A API aponta o campo com problema (ex.: senha atual incorreta)
      if (erro.campos) {
        const campos = { ...erro.campos };
        if (provisoria && campos.senhaAtual) campos.senhaAtual = 'A senha provisória está incorreta.';
        setErros((atuais) => ({ ...atuais, ...campos }));
      } else {
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
        <div>
          <h1 className="titulo">{provisoria ? 'Crie sua senha nova' : 'Trocar senha'}</h1>
          <p className="texto-apoio">
            {provisoria
              ? 'Você entrou com uma senha provisória. Crie agora uma senha só sua para continuar.'
              : 'Digite a senha que você usa hoje e escolha uma nova.'}
          </p>
        </div>

        <Aviso tipo="erro">{erroGeral}</Aviso>

        <Campo
          id="senhaAtual"
          rotulo={provisoria ? 'Senha provisória' : 'Senha atual'}
          dica={provisoria ? 'A que a responsável pela comunidade passou para você.' : undefined}
          erro={erros.senhaAtual}
        >
          <input
            id="senhaAtual"
            name="senhaAtual"
            type="password"
            autoComplete="current-password"
            value={form.senhaAtual}
            onChange={aoDigitar}
          />
        </Campo>

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

        {/* Com senha provisória não dá para "voltar": o resto do app só abre depois da troca */}
        {provisoria ? (
          <button
            type="button"
            className="botao-texto"
            onClick={() => {
              sair();
              navegar('/login', { replace: true });
            }}
          >
            Sair
          </button>
        ) : (
          <Link to={inicio} className="botao-texto">
            Cancelar
          </Link>
        )}
      </form>
    </div>
  );
}
