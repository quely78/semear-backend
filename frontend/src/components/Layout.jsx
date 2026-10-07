// =============================================================
// components/Layout.jsx — "Moldura" das telas internas:
// cabeçalho no topo, conteúdo no meio e menu fixo no rodapé.
//
// Uso:
//   <Layout cabecalho={{ titulo: 'Calendário' }}> ...conteúdo... </Layout>
// =============================================================
import Cabecalho from './Cabecalho';
import MenuInferior from './MenuInferior';

export default function Layout({ cabecalho = {}, comMenu = true, children }) {
  return (
    <div className={`tela ${comMenu ? 'tela--com-menu' : ''}`}>
      <Cabecalho {...cabecalho} />
      <main className="tela__conteudo">{children}</main>
      {comMenu && <MenuInferior />}
    </div>
  );
}