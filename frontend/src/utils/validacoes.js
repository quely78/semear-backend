// =============================================================
// utils/validacoes.js — Regras de validação dos formulários.
// Ficam separadas das telas para poderem ser testadas e reaproveitadas.
// Cada função devolve uma MENSAGEM DE ERRO (string) ou "" se estiver ok.
// =============================================================

/** Campo obrigatório: não pode ficar vazio. */
export function validarObrigatorio(valor, nomeCampo = 'Este campo') {
  return String(valor ?? '').trim() ? '' : `${nomeCampo} é obrigatório.`;
}

/**
 * Data de plantio.
 * - precisa ser uma data real (ex.: 31/02 não existe)
 * - RN03: no máximo 12 meses no futuro
 * @param {string} valor no formato do <input type="date">: "AAAA-MM-DD"
 */
export function validarDataPlantio(valor) {
  if (!valor) return 'Informe a data de plantio.';

  // Separa ano, mês e dia e confere se a data "fecha" (31/02 vira 03/03 no JS)
  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const dataExiste =
    data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  if (!dataExiste) return 'Data inválida — verifique o dia.';

  // Limite de 12 meses a partir de hoje (RN03)
  const limite = new Date();
  limite.setHours(0, 0, 0, 0);
  limite.setFullYear(limite.getFullYear() + 1);
  if (data > limite) return 'A data pode ser no máximo 12 meses no futuro (RN03).';

  return '';
}

/**
 * Área plantada em m².
 * RN02: somente valor positivo. Aceita vírgula ou ponto ("12,5" ou "12.5").
 */
export function validarArea(valor) {
  if (String(valor ?? '').trim() === '') return 'Informe a área plantada.';
  const numero = converterNumero(valor);
  if (!Number.isFinite(numero)) return 'Digite apenas números (ex.: 25 ou 12,5).';
  if (numero <= 0) return 'A área deve ser positiva (RN02).';
  return '';
}

/** Senha com tamanho mínimo, para a conta ficar mais segura. */
export function validarSenha(valor) {
  if (!valor) return 'Crie uma senha.';
  if (valor.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
  return '';
}

/**
 * Contato: aceita telefone (com ou sem DDD) ou e-mail.
 */
export function validarContato(valor) {
  const texto = String(valor ?? '').trim();
  if (!texto) return 'Informe seu telefone ou e-mail.';
  const ehEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
  const digitos = texto.replace(/\D/g, '');
  const ehTelefone = digitos.length >= 8 && digitos.length <= 13;
  return ehEmail || ehTelefone ? '' : 'Digite um telefone ou e-mail válido.';
}

/** Converte "12,5" → 12.5. Usado também ao enviar para a API. */
export function converterNumero(valor) {
  return Number(String(valor).replace(',', '.'));
}

/** Diz se um objeto de erros tem algum erro preenchido. */
export function temErros(erros) {
  return Object.values(erros).some(Boolean);
}