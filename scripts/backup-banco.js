// =============================================================
// scripts/backup-banco.js — Salva uma cópia do banco em ./backups
//
//   npm run db:backup                 → banco do .env (DATABASE_URL)
//   npm run db:backup -- "<url>"      → outro banco (ex.: External URL do Render)
//
// Usa o pg_dump de dentro do Docker (não precisa instalar o PostgreSQL).
// O arquivo sai compactado: backups/semear-AAAA-MM-DD-HHMM.sql.gz
// A pasta backups/ não vai para o GitHub (tem dados das agricultoras).
// =============================================================
require('dotenv').config();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url) {
  console.error('Informe a URL do banco ou configure DATABASE_URL no .env.');
  process.exit(1);
}

// Dentro do Docker, "localhost" é o próprio container: troca pelo computador
const urlParaDocker = url.replace(/@(localhost|127\.0\.0\.1)(?=[:/])/, '@host.docker.internal').replace(/\?schema=\w+$/, '');

const pasta = path.join(__dirname, '..', 'backups');
fs.mkdirSync(pasta, { recursive: true });
const carimbo = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
const arquivo = path.join(pasta, `semear-${carimbo}.sql.gz`);

const dump = spawn('docker', ['run', '--rm', 'postgres:17-alpine', 'pg_dump', '--no-owner', '--no-privileges', urlParaDocker], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
const saida = fs.createWriteStream(arquivo);
dump.stdout.pipe(zlib.createGzip({ level: 9 })).pipe(saida);

dump.on('error', () => {
  console.error('Não achei o Docker. Abra o Docker Desktop e tente de novo.');
  process.exit(1);
});
dump.on('close', (codigo) => {
  if (codigo !== 0) {
    fs.rmSync(arquivo, { force: true });
    console.error('O backup falhou (veja a mensagem acima).');
    process.exit(codigo);
  }
  const avisar = () => {
    const tamanho = (fs.statSync(arquivo).size / 1024).toFixed(1);
    console.log(`Backup salvo: ${path.relative(process.cwd(), arquivo)} (${tamanho} KB)`);
  };
  // O arquivo pode já ter terminado de gravar antes do pg_dump fechar
  if (saida.writableFinished) avisar();
  else saida.on('finish', avisar);
});
