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

/**
 * Relatório como imagem PNG (bom para mandar pelo WhatsApp).
 * @param {object} r
 * @param {string} r.titulo        ex.: "Relatório de produção e vendas"
 * @param {string} r.periodo       ex.: "01/01/2026 a 25/11/2026"
 * @param {Array<[string,string]>} r.dados  linhas "Rótulo: valor" (agricultora, comunidade...)
 * @param {string[]} r.cabecalhos  colunas da tabela
 * @param {string[][]} r.linhas    linhas da tabela (a 1ª coluna é o nome)
 * @param {string[]} r.total       linha de total
 * @param {string[]} r.resultado   ex.: ["Resultado: R$ 1.085,00", "Margem: 52%"]
 * @param {string} r.rodape
 */
export async function baixarRelatorioPng(r) {
  await document.fonts?.ready;
  const largura = 720;
  const margem = 40;
  const linhaTabela = 34;
  const altura = 250 + r.dados.length * 26 + (r.linhas.length + 2) * linhaTabela + 80;
  const escala = 2;

  const canvas = document.createElement('canvas');
  canvas.width = largura * escala;
  canvas.height = altura * escala;
  const ctx = canvas.getContext('2d');
  ctx.scale(escala, escala);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, largura, altura);

  // Cabeçalho
  ctx.fillStyle = '#355e3b';
  ctx.font = '700 30px "Baloo 2", system-ui, sans-serif';
  ctx.fillText('SemeAR', margem, 62);
  ctx.fillStyle = COR_SUAVE;
  ctx.font = '400 15px "Work Sans", system-ui, sans-serif';
  ctx.fillText(r.titulo, margem, 86);
  ctx.textAlign = 'right';
  ctx.fillText(r.periodo, largura - margem, 62);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#355e3b';
  ctx.fillRect(margem, 104, largura - margem * 2, 3);

  // Dados da agricultora
  let y = 140;
  r.dados.forEach(([rotulo, valor]) => {
    ctx.fillStyle = COR_TINTA;
    ctx.font = '700 15px "Work Sans", system-ui, sans-serif';
    ctx.fillText(rotulo, margem, y);
    const w = ctx.measureText(`${rotulo} `).width;
    ctx.font = '400 15px "Work Sans", system-ui, sans-serif';
    ctx.fillText(valor, margem + w, y);
    y += 26;
  });

  // Tabela
  y += 14;
  const colunas = r.cabecalhos.length;
  const larguraTabela = largura - margem * 2;
  const xColuna = (i) => (i === 0 ? margem + 10 : margem + larguraTabela - (colunas - 1 - i) * 150 - 10);
  const escrever = (valores, peso) => {
    ctx.font = `${peso} 14px "Work Sans", system-ui, sans-serif`;
    ctx.fillStyle = COR_TINTA;
    valores.forEach((v, i) => {
      ctx.textAlign = i === 0 ? 'left' : 'right';
      ctx.fillText(v, xColuna(i), y + 22);
    });
    ctx.textAlign = 'left';
  };
  ctx.fillStyle = '#e7f0dc';
  ctx.fillRect(margem, y, larguraTabela, linhaTabela);
  escrever(r.cabecalhos, 700);
  y += linhaTabela;
  r.linhas.forEach((linha) => {
    escrever(linha, 400);
    y += linhaTabela;
    ctx.fillStyle = '#e3d8c3';
    ctx.fillRect(margem, y - 1, larguraTabela, 1);
  });
  escrever(r.total, 700);
  y += linhaTabela + 16;

  // Resultado
  ctx.fillStyle = '#e7f0dc';
  ctx.fillRect(margem, y, larguraTabela, 44);
  ctx.fillStyle = COR_TINTA;
  ctx.font = '700 16px "Work Sans", system-ui, sans-serif';
  ctx.fillText(r.resultado[0], margem + 14, y + 28);
  ctx.textAlign = 'right';
  ctx.fillText(r.resultado[1], largura - margem - 14, y + 28);
  ctx.textAlign = 'left';

  ctx.fillStyle = COR_SUAVE;
  ctx.font = '400 12px "Work Sans", system-ui, sans-serif';
  ctx.fillText(r.rodape, margem, altura - 28);

  baixar(canvas.toDataURL('image/png'), `${nomeDeArquivo(`relatorio ${r.periodo}`)}.png`);
}
