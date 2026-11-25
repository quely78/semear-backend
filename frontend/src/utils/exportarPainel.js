// =============================================================
// utils/exportarPainel.js — Exportar os painéis.
//
//   baixarGraficoDoCartao(cartao, nome) → PNG de um gráfico (título,
//       legenda, o desenho e a data), feito no próprio aparelho
//   baixarCsv(nome, cabecalhos, linhas) → planilha (abre no Excel)
//   imprimir(classe) → abre a impressão ("Salvar como PDF") mostrando
//       só a parte marcada para exportar
// Nada é enviado para a internet.
// =============================================================

const COR_FUNDO = '#fffbf3';
const COR_TINTA = '#22301f';
const COR_SUAVE = '#5d6657';

function baixar(url, arquivo) {
  const link = document.createElement('a');
  link.href = url;
  link.download = arquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** "Entradas e saídas" → "entradas-e-saidas". */
export function nomeDeArquivo(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Copia o SVG com os estilos de texto "por escrito" (o CSS da página não vai junto). */
function svgComEstilos(svg) {
  const copia = svg.cloneNode(true);
  const originais = svg.querySelectorAll('text');
  copia.querySelectorAll('text').forEach((texto, i) => {
    const estilo = getComputedStyle(originais[i]);
    texto.setAttribute('font-family', estilo.fontFamily);
    texto.setAttribute('font-size', estilo.fontSize);
    texto.setAttribute('font-weight', estilo.fontWeight);
    texto.setAttribute('fill', estilo.fill);
  });
  copia.querySelectorAll('[tabindex]').forEach((el) => el.removeAttribute('tabindex'));
  copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new XMLSerializer().serializeToString(copia);
}

function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Baixa o gráfico de um cartão como PNG.
 * @param {HTMLElement} cartao  o cartão (com .painel-cartao__titulo, legenda e o <svg>)
 * @param {object} info { titulo, subtitulo }
 */
export async function baixarGraficoDoCartao(cartao, { titulo, subtitulo }) {
  const svg = cartao.querySelector('.grafico-painel__area svg');
  if (!svg) throw new Error('Este gráfico não pode ser baixado como imagem.');
  await document.fonts?.ready;

  const larguraSvg = svg.width.baseVal.value;
  const alturaSvg = svg.height.baseVal.value;
  const escala = 2;
  const margem = 28;
  const legenda = [...cartao.querySelectorAll('.grafico-painel__legenda li:not(.grafico-painel__legenda-item--oculta)')]
    .filter((li) => li.querySelector('.grafico-painel__chave')) // ignora "Mostrar todos"
    .map((li) => ({
    nome: li.textContent.trim(),
    cor: li.querySelector('.grafico-painel__chave')?.style.background,
  }));
  const topo = 78 + (legenda.length ? 28 : 0);
  const largura = larguraSvg + margem * 2;
  const altura = topo + alturaSvg + 44;

  const canvas = document.createElement('canvas');
  canvas.width = largura * escala;
  canvas.height = altura * escala;
  const ctx = canvas.getContext('2d');
  ctx.scale(escala, escala);
  ctx.fillStyle = COR_FUNDO;
  ctx.fillRect(0, 0, largura, altura);

  ctx.fillStyle = COR_TINTA;
  ctx.font = '700 20px "Baloo 2", system-ui, sans-serif';
  ctx.fillText(titulo, margem, 38);
  ctx.fillStyle = COR_SUAVE;
  ctx.font = '400 13px "Work Sans", system-ui, sans-serif';
  if (subtitulo) ctx.fillText(subtitulo, margem, 60);

  let xLegenda = margem;
  legenda.forEach(({ nome, cor }) => {
    ctx.fillStyle = cor || COR_TINTA;
    ctx.fillRect(xLegenda, 80, 12, 12);
    ctx.fillStyle = COR_TINTA;
    ctx.fillText(nome, xLegenda + 18, 91);
    xLegenda += 18 + ctx.measureText(nome).width + 18;
  });

  const url = URL.createObjectURL(new Blob([svgComEstilos(svg)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const imagem = await carregarImagem(url);
    ctx.drawImage(imagem, margem, topo, larguraSvg, alturaSvg);
  } finally {
    URL.revokeObjectURL(url);
  }

  ctx.fillStyle = COR_SUAVE;
  ctx.font = '400 11px "Work Sans", system-ui, sans-serif';
  ctx.fillText(`SemeAR · gerado em ${new Date().toLocaleDateString('pt-BR')}`, margem, altura - 16);

  baixar(canvas.toDataURL('image/png'), `${nomeDeArquivo(titulo)}.png`);
}

/** Planilha CSV (separador ";" e vírgula decimal: abre certo no Excel em português). */
export function baixarCsv(nome, cabecalhos, linhas) {
  const celula = (v) => {
    const texto = typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 2, useGrouping: false }) : String(v ?? '');
    return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  const conteudo = [cabecalhos, ...linhas].map((linha) => linha.map(celula).join(';')).join('\r\n');
  // BOM (0xFEFF) no começo: avisa o Excel que o arquivo é UTF-8 (acentos aparecem certos)
  const url = URL.createObjectURL(new Blob([`${String.fromCharCode(0xfeff)}${conteudo}`], { type: 'text/csv;charset=utf-8' }));
  baixar(url, `${nomeDeArquivo(nome)}.csv`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Abre a impressão mostrando só o que tem a classe certa:
 *   'imprimindo-painel'    → .painel-exportavel
 *   'imprimindo-relatorio' → .relatorio
 */
export function imprimir(classe) {
  document.body.classList.add(classe);
  const limpar = () => {
    document.body.classList.remove(classe);
    window.removeEventListener('afterprint', limpar);
  };
  window.addEventListener('afterprint', limpar);
  window.print();
}
