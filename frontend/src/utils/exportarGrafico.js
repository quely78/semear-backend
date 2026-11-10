// =============================================================
// utils/exportarGrafico.js — Baixa o gráfico de espécies como
// imagem PNG (fácil de mandar pelo WhatsApp ou imprimir).
//
// O gráfico da tela é feito em HTML/CSS; para virar imagem, ele é
// desenhado de novo em um <canvas>, com título, totais e data.
// Nada é enviado para a internet: a imagem é gerada no próprio celular.
// =============================================================
import { formatarArea } from './formatadores';

const LARGURA = 1080; // px (boa nitidez no celular e na impressão)
const MARGEM = 72;
const COR = {
  fundo: '#fffbf3',
  tinta: '#22301f',
  suave: '#5d6657',
  verde: '#355e3b',
  rosa: '#be3e73',
  trilho: '#efe5d2',
  linha: '#e3d8c3',
};

/** Carrega uma imagem (ex.: o ícone do app). Se falhar, segue sem ela. */
function carregarImagem(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Retângulo com cantos arredondados. */
function retangulo(ctx, x, y, largura, altura, raio, cor) {
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(largura, 0), altura, raio);
  ctx.fill();
}

/**
 * Gera e baixa o PNG.
 * @param {object} opcoes
 * @param {string} opcoes.titulo      ex.: "Distribuição de espécies"
 * @param {string} opcoes.subtitulo   ex.: "Comunidade 2"
 * @param {Array<{rotulo:string, valor:string}>} opcoes.totais  ex.: [{rotulo:'área total', valor:'120 m²'}]
 * @param {Array<{especie:string, area:number}>} opcoes.itens
 * @param {string[]} opcoes.cores     cores das barras, em sequência
 */
export async function baixarGraficoPng({ titulo, subtitulo, totais, itens, cores }) {
  // Garante que as fontes da identidade visual já estão prontas para o canvas
  await Promise.all([
    document.fonts?.load('700 48px "Baloo 2"'),
    document.fonts?.load('400 30px "Work Sans"'),
    document.fonts?.load('600 30px "Work Sans"'),
  ]).catch(() => {});
  const icone = await carregarImagem('/icone.png');

  const alturaLinha = 112;
  const topoBarras = 420;
  const altura = topoBarras + itens.length * alturaLinha + 140;

  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');

  // Fundo
  ctx.fillStyle = COR.fundo;
  ctx.fillRect(0, 0, LARGURA, altura);

  // Cabeçalho: ícone + "SemeAR"
  if (icone) ctx.drawImage(icone, MARGEM, 56, 72, 72);
  ctx.font = '700 44px "Baloo 2", sans-serif';
  ctx.fillStyle = COR.verde;
  ctx.fillText('Seme', MARGEM + (icone ? 92 : 0), 110);
  const larguraSeme = ctx.measureText('Seme').width;
  ctx.fillStyle = COR.rosa;
  ctx.fillText('AR', MARGEM + (icone ? 92 : 0) + larguraSeme, 110);

  // Título e subtítulo
  ctx.font = '700 56px "Baloo 2", sans-serif';
  ctx.fillStyle = COR.verde;
  ctx.fillText(titulo, MARGEM, 218);
  ctx.font = '400 30px "Work Sans", sans-serif';
  ctx.fillStyle = COR.suave;
  ctx.fillText(subtitulo, MARGEM, 264);

  // Totais (caixinhas lado a lado)
  const larguraCaixa = (LARGURA - MARGEM * 2 - 24 * (totais.length - 1)) / totais.length;
  totais.forEach((total, i) => {
    const x = MARGEM + i * (larguraCaixa + 24);
    retangulo(ctx, x, 300, larguraCaixa, 88, 20, COR.verde);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 38px "Baloo 2", sans-serif';
    ctx.fillText(total.valor, x + 24, 346);
    ctx.font = '400 22px "Work Sans", sans-serif';
    ctx.fillText(total.rotulo, x + 24, 374);
  });

  // Barras
  const maior = Math.max(...itens.map((item) => item.area), 1);
  const larguraBarra = LARGURA - MARGEM * 2;
  itens.forEach((item, i) => {
    const y = topoBarras + 40 + i * alturaLinha;
    ctx.font = '400 30px "Work Sans", sans-serif';
    ctx.fillStyle = COR.tinta;
    ctx.textAlign = 'left';
    ctx.fillText(item.especie, MARGEM, y);
    ctx.font = '600 30px "Work Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(formatarArea(item.area), LARGURA - MARGEM, y);
    ctx.textAlign = 'left';

    retangulo(ctx, MARGEM, y + 20, larguraBarra, 28, 14, COR.trilho);
    retangulo(ctx, MARGEM, y + 20, (item.area / maior) * larguraBarra, 28, 14, cores[i % cores.length]);
  });

  // Rodapé
  const data = new Date().toLocaleDateString('pt-BR');
  ctx.strokeStyle = COR.linha;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGEM, altura - 90);
  ctx.lineTo(LARGURA - MARGEM, altura - 90);
  ctx.stroke();
  ctx.font = '400 24px "Work Sans", sans-serif';
  ctx.fillStyle = COR.suave;
  ctx.fillText(`Gerado pelo SemeAR em ${data}`, MARGEM, altura - 46);

  // Baixa o arquivo
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Não foi possível gerar a imagem.');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `semear-grafico-${new Date().toISOString().slice(0, 10)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
