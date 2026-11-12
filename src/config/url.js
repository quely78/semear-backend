// Endereços vindos do .env podem chegar sem "https://" (o Render entrega só o
// domínio, ex.: "semear-front.onrender.com"). Aqui completamos e tiramos a "/" final.
function comProtocolo(endereco) {
  const limpo = String(endereco || '').trim().replace(/\/+$/, '');
  if (!limpo) return '';
  return /^https?:\/\//i.test(limpo) ? limpo : `https://${limpo}`;
}

/** Lista de origens separadas por vírgula: "a.com, http://localhost:5173". */
function listaDeOrigens(valor) {
  return String(valor || '')
    .split(',')
    .map(comProtocolo)
    .filter(Boolean);
}

module.exports = { comProtocolo, listaDeOrigens };
