// Erro "esperado" da API: já traz o status HTTP e uma mensagem que pode ir para a tela.
// Qualquer outro erro (banco fora do ar, bug, erro do Prisma) é tratado como 500
// e a mensagem técnica fica só no log do servidor.
class ErroApi extends Error {
  /**
   * @param {number} status  código HTTP (ex.: 400, 401)
   * @param {string} message mensagem para a usuária
   * @param {Object<string, string>} [campos] erro de cada campo: { senha: 'A senha precisa...' }
   */
  constructor(status, message, campos) {
    super(message);
    this.status = status;
    if (campos && Object.keys(campos).length) this.campos = campos;
  }
}

/** Erro 400 com o problema de cada campo. A mensagem geral é a do primeiro campo. */
function erroDeValidacao(campos) {
  const mensagens = Object.values(campos);
  const message =
    mensagens.length === 1 ? mensagens[0] : 'Alguns campos estão inválidos. Corrija e tente de novo.';
  return new ErroApi(400, message, campos);
}

/**
 * Responde um erro no padrão da API: { message, campos? }.
 * Erros inesperados viram 500 com mensagem genérica (sem detalhes internos).
 */
function responderErro(res, error, mensagemInesperada = 'Não foi possível concluir. Tente novamente.') {
  if (error instanceof ErroApi) {
    const corpo = { message: error.message };
    if (error.campos) corpo.campos = error.campos;
    return res.status(error.status).json(corpo);
  }
  console.error(error);
  return res.status(500).json({ message: mensagemInesperada });
}

module.exports = { ErroApi, erroDeValidacao, responderErro };
