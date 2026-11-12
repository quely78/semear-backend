// =============================================================
// pages/Perfil.jsx — Meu perfil.  /perfil
//
// Agricultora e responsável veem os próprios dados e podem mudar
// o nome e o contato (telefone ou e-mail, que também é o login).
// Daqui também se chega na troca de senha.
// =============================================================
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Aviso from '../components/Aviso';
import Campo from '../components/Campo';
import Carregando from '../components/Carregando';
import Icone from '../components/Icone';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { obterPerfil, salvarPerfil } from '../services/perfilService';
import { temErros, validarContato, validarObrigatorio } from '../utils/validacoes';

const PAPEIS = {
  AGRICULTORA: 'Agricultora',
  COORDENADORA: 'Responsável pela comunidade',
};

/** "Maria Souza" → "MS" */
function iniciais(nome = '') {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

export default function Perfil() {
  const { usuario, atualizarUsuario } = useAuth();
  const inicio = usuario?.tipo === 'COORDENADORA' ? '/coordenadora' : '/plantios';

  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState({ nome: '', contato: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    obterPerfil()
      .then((dados) => {
        setPerfil(dados);
        setForm({ nome: dados.nome, contato: dados.contato });
      })
      .catch((e) => setErroGeral(e.message))
      .finally(() => setCarregando(false));
  }, []);

  const mudou = perfil && (form.nome.trim() !== perfil.nome || form.contato.trim() !== perfil.contato);

  function aoDigitar(evento) {
    const { name, value } = evento.target;
    setForm((atual) => ({ ...atual, [name]: value }));
    setErros((atual) => ({ ...atual, [name]: '' }));
    setSucesso('');
  }

  async function aoSalvar(evento) {
    evento.preventDefault();
    setErroGeral('');
    setSucesso('');
    const novosErros = {
      nome: validarObrigatorio(form.nome, 'Nome'),
      contato: validarContato(form.contato),
    };
    setErros(novosErros);
    if (temErros(novosErros)) return;

    setSalvando(true);
    try {
      const atualizado = await salvarPerfil({ nome: form.nome.trim(), contato: form.contato.trim() });
      setPerfil(atualizado);
      setForm({ nome: atualizado.nome, contato: atualizado.contato });
      // Atualiza o "Olá, Nome" do cabeçalho e a sessão guardada
      atualizarUsuario({ nome: atualizado.nome, contato: atualizado.contato });
      setSucesso(
        atualizado.contato !== usuario?.contato
          ? 'Perfil salvo. Da próxima vez, entre com o contato novo.'
          : 'Perfil salvo.',
      );
    } catch (e) {
      if (e.campos) setErros((atuais) => ({ ...atuais, ...e.campos }));
      else setErroGeral(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Layout cabecalho={{ voltarPara: inicio, rotuloVoltar: 'Início' }}>
      <h1 className="titulo">Meu perfil</h1>

      {carregando && <Carregando texto="Carregando seu perfil..." />}
      <Aviso tipo="erro">{erroGeral}</Aviso>

      {perfil && (
        <>
          {/* Cartão com quem é a usuária */}
          <section className="cartao perfil-cartao" aria-label="Seus dados">
            <span className="perfil-cartao__avatar" aria-hidden="true">
              {iniciais(perfil.nome)}
            </span>
            <div>
              <p className="perfil-cartao__nome">{perfil.nome}</p>
              <p className="perfil-cartao__papel">{PAPEIS[perfil.tipo] || perfil.tipo}</p>
              <p className="texto-apoio">
                {perfil.comunidade ? perfil.comunidade.nome : 'Sem comunidade'} · no SemeAR desde{' '}
                {new Date(perfil.criadoEm).toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </section>

          {/* Editar nome e contato */}
          <form className="formulario" onSubmit={aoSalvar} noValidate>
            <h2 className="subtitulo">Editar dados</h2>
            <Aviso tipo="sucesso">{sucesso}</Aviso>

            <Campo id="nome" rotulo="Nome" erro={erros.nome}>
              <input id="nome" name="nome" type="text" autoComplete="name" value={form.nome} onChange={aoDigitar} />
            </Campo>

            <Campo
              id="contato"
              rotulo="Contato (telefone ou e-mail)"
              dica="É com ele que você entra no SemeAR."
              erro={erros.contato}
            >
              <input
                id="contato"
                name="contato"
                type="text"
                autoComplete="username"
                value={form.contato}
                onChange={aoDigitar}
              />
            </Campo>

            <button className="botao botao--primario" type="submit" disabled={salvando || !mudou}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>

          <section className="perfil-seguranca">
            <h2 className="subtitulo">Senha</h2>
            <Link to="/trocar-senha" className="botao botao--secundario">
              <Icone nome="chave" tamanho={18} /> Trocar minha senha
            </Link>
          </section>
        </>
      )}
    </Layout>
  );
}
