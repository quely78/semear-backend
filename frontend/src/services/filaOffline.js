// =============================================================
// services/filaOffline.js — Registros feitos SEM INTERNET.
//
// Quando a agricultora anota um plantio, gasto ou venda sem conexão,
// o pedido fica guardado no celular (localStorage) e é enviado sozinho
// quando a internet volta (ao abrir o app, ao reconectar e a cada 30 s).
//
// Cada registro guarda de quem é: só é enviado com a mesma conta logada.
// Se a API recusar (ex.: venda maior que o estoque), o registro sai da
// fila e aparece na lista de "não enviados", com o motivo.
// =============================================================
import { ErroApi, obterUsuarioSalvo, requisicao } from './api';

const CHAVE_FILA = 'semear_fila';
const CHAVE_FALHAS = 'semear_fila_falhas';
export const EVENTO_FILA = 'semear:fila';

function ler(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave) || '[]');
  } catch {
    return [];
  }
}

function gravar(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
  window.dispatchEvent(new Event(EVENTO_FILA));
}

const doUsuario = (item) => item.usuarioId === obterUsuarioSalvo()?.id;

/** Registros da conta logada esperando internet. */
export const itensNaFila = () => ler(CHAVE_FILA).filter(doUsuario);

/** Registros que a API recusou (com o motivo). */
export const falhasDaFila = () => ler(CHAVE_FALHAS).filter(doUsuario);

export function descartarFalhas() {
  gravar(
    CHAVE_FALHAS,
    ler(CHAVE_FALHAS).filter((f) => !doUsuario(f)),
  );
}

/**
 * Faz o pedido; se não houver internet, guarda na fila.
 * @returns {Promise<any>} a resposta da API, ou { pendente: true } se ficou guardado
 */
export async function enviarOuGuardar(caminho, { method, body, descricao }) {
  try {
    return await requisicao(caminho, { method, body });
  } catch (erro) {
    if (!(erro instanceof ErroApi) || erro.status !== 0) throw erro;
    const usuario = obterUsuarioSalvo();
    gravar(CHAVE_FILA, [
      ...ler(CHAVE_FILA),
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, usuarioId: usuario?.id, caminho, method, body, descricao, criadoEm: new Date().toISOString() },
    ]);
    return { pendente: true };
  }
}

let enviando = false;

/**
 * Tenta enviar a fila, na ordem em que foi anotada.
 * Para no primeiro "sem internet" (tenta de novo depois).
 * @returns {Promise<number>} quantos registros foram enviados
 */
export async function enviarFila() {
  if (enviando || !navigator.onLine) return 0;
  enviando = true;
  let enviados = 0;
  try {
    for (const item of itensNaFila()) {
      try {
        await requisicao(item.caminho, { method: item.method, body: item.body });
        enviados += 1;
        gravar(CHAVE_FILA, ler(CHAVE_FILA).filter((i) => i.id !== item.id));
      } catch (erro) {
        if (erro instanceof ErroApi && erro.status === 0) break; // ainda sem internet
        if (erro instanceof ErroApi && erro.status === 401) break; // sessão expirada: envia depois do login
        // A API recusou: sai da fila e vai para "não enviados"
        gravar(CHAVE_FILA, ler(CHAVE_FILA).filter((i) => i.id !== item.id));
        gravar(CHAVE_FALHAS, [...ler(CHAVE_FALHAS), { ...item, motivo: erro.message }]);
      }
    }
  } finally {
    enviando = false;
  }
  return enviados;
}
