/**
 * Libera a rota só para os perfis informados (usar DEPOIS do middleware `autenticar`).
 *   router.use(autenticar, exigirPerfil('AGRICULTORA'));
 * Outro perfil recebe 403 com a mensagem informada.
 */
function exigirPerfil(tipo, mensagem) {
  return (req, res, next) => {
    if (req.user?.tipo !== tipo) return res.status(403).json({ message: mensagem });
    return next();
  };
}

const soAgricultora = exigirPerfil('AGRICULTORA', 'Apenas agricultoras podem gerenciar plantios.');
const soResponsavel = exigirPerfil(
  'COORDENADORA',
  'Apenas a responsável pela comunidade pode ver estes dados.',
);

module.exports = { exigirPerfil, soAgricultora, soResponsavel };
