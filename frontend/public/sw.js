// =============================================================
// sw.js — Service worker do SemeAR (uso no campo, com internet fraca).
//
//   App (telas, estilos, ícones) ... guardado no celular: abre sem internet
//   Dados da API (GET) ............. rede primeiro; sem rede, a última
//                                    resposta guardada (mostra os dados de antes)
//   Envios (POST/PUT/DELETE) ....... nunca guardados aqui (a fila do app cuida)
//
// Ao sair da conta, o app pede para apagar os dados guardados
// (celular dividido entre duas pessoas não mistura os dados).
// =============================================================
const VERSAO = 'semear-v1';
const CACHE_APP = `${VERSAO}-app`;
const CACHE_DADOS = `${VERSAO}-dados`;

self.addEventListener('install', (evento) => {
  self.skipWaiting();
  evento.waitUntil(caches.open(CACHE_APP).then((cache) => cache.addAll(['/', '/icone.png', '/manifest.webmanifest'])));
});

self.addEventListener('activate', (evento) => {
  // Apaga caches de versões antigas
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => !c.startsWith(VERSAO)).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (evento) => {
  if (evento.data === 'apagar-dados') evento.waitUntil(caches.delete(CACHE_DADOS));
});

/** Rede primeiro; se falhar, a última cópia guardada. */
async function redePrimeiro(pedido, nomeCache, reserva) {
  const cache = await caches.open(nomeCache);
  try {
    const resposta = await fetch(pedido);
    if (resposta.ok) cache.put(reserva || pedido, resposta.clone());
    return resposta;
  } catch (erro) {
    const guardada = await cache.match(reserva || pedido);
    if (guardada) return guardada;
    throw erro;
  }
}

/** Cache primeiro (arquivos que não mudam: têm o "hash" no nome). */
async function cachePrimeiro(pedido) {
  const cache = await caches.open(CACHE_APP);
  const guardada = await cache.match(pedido);
  if (guardada) return guardada;
  const resposta = await fetch(pedido);
  if (resposta.ok) cache.put(pedido, resposta.clone());
  return resposta;
}

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);

  // Telas (navegação): rede primeiro; sem internet, o app guardado
  if (pedido.mode === 'navigate') {
    evento.respondWith(redePrimeiro(pedido, CACHE_APP, '/'));
    return;
  }
  // Arquivos do próprio app
  if (url.origin === self.location.origin) {
    evento.respondWith(cachePrimeiro(pedido));
    return;
  }
  // API, previsão do tempo e fontes (outros endereços): rede primeiro
  evento.respondWith(redePrimeiro(pedido, CACHE_DADOS));
});
