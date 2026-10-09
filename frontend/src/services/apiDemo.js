// =============================================================
// services/apiDemo.js — API SIMULADA (modo demonstração).
//
// Para que serve? Permite navegar por TODAS as telas sem o back-end.
// Liga/desliga no arquivo .env:
//   VITE_MODO_DEMO=true   → usa estes dados de exemplo
//   VITE_MODO_DEMO=false  → usa a API de verdade (semear-backend)
//
// Ela responde às MESMAS rotas da API real, com o mesmo formato,
// então nenhuma tela precisa saber se está em modo demo ou não.
// Os dados ficam salvos no navegador (localStorage), assim os
// plantios cadastrados não somem ao recarregar a página.
//
// Login de teste:
//   - qualquer contato e senha → entra como AGRICULTORA
//   - contato contendo "coord" (ex.: coordenadora) → entra como COORDENADORA
// =============================================================
import { CALENDARIO_REFERENCIA } from '../config/dados';

// Chave onde os plantios de exemplo ficam guardados no navegador
const CHAVE_DADOS = 'semear_demo_plantios';

// Plantios iniciais (os mesmos exemplos do wireframe)
const PLANTIOS_INICIAIS = [
  { id: 1, especie: 'Milho', dataPlantio: '2026-03-12T00:00:00.000Z', area: 40, tipoCultivo: 'orgânico' },
  { id: 2, especie: 'Mandioca', dataPlantio: '2026-02-02T00:00:00.000Z', area: 25, tipoCultivo: 'convencional' },
  { id: 3, especie: 'Feijão', dataPlantio: '2026-01-20T00:00:00.000Z', area: 15, tipoCultivo: 'orgânico' },
];

// Números "do resto da comunidade" somados aos plantios da usuária no painel
const COMUNIDADE_BASE = {
  agricultorasAtivas: 18,
  especies: { Milho: 80, Mandioca: 72, Feijão: 45, Abóbora: 35 },
};

// ---------- Funções auxiliares ----------

/** Lê os plantios guardados (ou os iniciais na primeira vez). */
function lerPlantios() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_DADOS)) || [...PLANTIOS_INICIAIS];
  } catch {
    return [...PLANTIOS_INICIAIS];
  }
}

/** Guarda a lista de plantios no navegador. */
function salvarPlantios(lista) {
  localStorage.setItem(CHAVE_DADOS, JSON.stringify(lista));
}

/** Simula o tempo de resposta da internet (deixa o "carregando" aparecer). */
function esperar(ms = 350) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/** Cria um erro igual ao que a API real devolveria. */
function erro(mensagem, status) {
  const e = new Error(mensagem);
  e.status = status;
  return e;
}

/** Valida os dados de um plantio (mesmas regras do back-end). */
function validarPlantio(dados) {
  const { especie, dataPlantio, area, tipoCultivo } = dados;
  if (!especie || !dataPlantio || area === undefined || !tipoCultivo) {
    throw erro('especie, dataPlantio, area e tipoCultivo são obrigatórios.', 400);
  }
  if (!(Number(area) > 0)) throw erro('area deve ser um número maior que zero.', 400);
  return {
    especie,
    dataPlantio: new Date(dataPlantio).toISOString(),
    area: Number(area),
    tipoCultivo,
  };
}

// ---------- Rotas simuladas ----------

/**
 * Responde como a API real responderia.
 * @param {string} caminho ex.: '/plantios?especie=Milho'
 * @param {{method?:string, body?:object}} opcoes
 */
export async function requisicaoDemo(caminho, { method = 'GET', body } = {}) {
  await esperar();

  // Separa o caminho dos filtros (?especie=...)
  const url = new URL(caminho, 'http://demo');
  const rota = url.pathname;

  // ---- Autenticação ----
  if (rota === '/auth/cadastro' && method === 'POST') {
    return { id: Date.now(), nome: body.nome, contato: body.contato, tipo: body.tipo };
  }

  if (rota === '/auth/login' && method === 'POST') {
    const coordenadora = String(body.contato).toLowerCase().includes('coord');
    return {
      token: 'token-demo',
      usuario: {
        id: 1,
        nome: coordenadora ? 'Coordenadora Demo' : 'Maria Agricultora',
        contato: body.contato,
        tipo: coordenadora ? 'COORDENADORA' : 'AGRICULTORA',
      },
    };
  }

  // ---- Plantios ----
  if (rota === '/plantios' && method === 'GET') {
    let lista = lerPlantios();
    const especie = url.searchParams.get('especie');
    const dataInicio = url.searchParams.get('dataInicio');
    if (especie) lista = lista.filter((p) => p.especie.toLowerCase().includes(especie.toLowerCase()));
    if (dataInicio) lista = lista.filter((p) => new Date(p.dataPlantio) >= new Date(dataInicio));
    // Mais recentes primeiro (igual à API)
    return lista.sort((a, b) => new Date(b.dataPlantio) - new Date(a.dataPlantio));
  }

  if (rota === '/plantios' && method === 'POST') {
    const lista = lerPlantios();
    const novo = { id: Date.now(), ...validarPlantio(body) };
    salvarPlantios([...lista, novo]);
    return novo;
  }

  const rotaPlantio = rota.match(/^\/plantios\/(\d+)$/);
  if (rotaPlantio) {
    const id = Number(rotaPlantio[1]);
    const lista = lerPlantios();
    const existe = lista.some((p) => p.id === id);
    if (!existe) throw erro('Plantio não encontrado.', 400);

    if (method === 'PUT') {
      const atualizado = { id, ...validarPlantio(body) };
      salvarPlantios(lista.map((p) => (p.id === id ? atualizado : p)));
      return atualizado;
    }
    if (method === 'DELETE') {
      salvarPlantios(lista.filter((p) => p.id !== id));
      return null;
    }
  }

  // ---- Calendário ----
  const rotaCalendario = rota.match(/^\/calendario\/(.+)$/);
  if (rotaCalendario) {
    const especie = decodeURIComponent(rotaCalendario[1]).toLowerCase();
    const item = CALENDARIO_REFERENCIA.find((c) => c.especie.toLowerCase() === especie);
    if (!item) throw erro('Calendário não encontrado para a espécie informada.', 404);
    return item;
  }

  // ---- Painel da comunidade ----
  if (rota === '/dashboard/comunidade') {
    // Soma os plantios da usuária com os números do resto da comunidade
    const porEspecie = { ...COMUNIDADE_BASE.especies };
    lerPlantios().forEach((p) => {
      porEspecie[p.especie] = (porEspecie[p.especie] || 0) + Number(p.area);
    });
    const especies = Object.entries(porEspecie)
      .map(([especie, area]) => ({ especie, area }))
      .sort((a, b) => b.area - a.area);
    return {
      areaTotal: especies.reduce((soma, e) => soma + e.area, 0),
      agricultorasAtivas: COMUNIDADE_BASE.agricultorasAtivas,
      especies,
    };
  }

  throw erro('Rota não encontrada (modo demonstração).', 404);
}