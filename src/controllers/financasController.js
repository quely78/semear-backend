const financasService = require('../services/financasService');
const { responderErro } = require('../utils/erros');

// O perfil (agricultora ou responsável) é conferido nas rotas.

const ERRO_CARREGAR = 'Não foi possível carregar as finanças agora.';
const ERRO_SALVAR = 'Não foi possível salvar agora. Tente novamente.';
const ERRO_APAGAR = 'Não foi possível apagar agora. Tente novamente.';

/** Monta um handler: chama o service e responde com o status pedido. */
const handler = (acao, mensagemDeErro, status = 200) => async (req, res) => {
  try {
    return res.status(status).json(await acao(req));
  } catch (error) {
    return responderErro(res, error, mensagemDeErro);
  }
};

module.exports = {
  doPlantio: handler((req) => financasService.obterFinancas(req.params.id, req.user.id), ERRO_CARREGAR),
  criarGasto: handler(
    (req) => financasService.criarGasto(req.params.id, req.body, req.user.id),
    ERRO_SALVAR,
    201,
  ),
  excluirGasto: handler(
    (req) => financasService.excluirGasto(req.params.id, req.params.itemId, req.user.id),
    ERRO_APAGAR,
  ),
  criarVenda: handler(
    (req) => financasService.criarVenda(req.params.id, req.body, req.user.id),
    ERRO_SALVAR,
    201,
  ),
  excluirVenda: handler(
    (req) => financasService.excluirVenda(req.params.id, req.params.itemId, req.user.id),
    ERRO_APAGAR,
  ),
  daAgricultora: handler(
    (req) => financasService.resumoDaAgricultora(req.user.id, req.query),
    ERRO_CARREGAR,
  ),
  daComunidade: handler((req) => financasService.resumoDaComunidade(req.user, req.query), ERRO_CARREGAR),
};
