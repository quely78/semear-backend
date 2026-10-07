// =============================================================
// components/RotaProtegida.jsx — Bloqueia telas para quem não fez login.
//
// Uso em App.jsx:
//   <Route element={<RotaProtegida perfis={['AGRICULTORA']} />}> ... </Route>
// Se "perfis" for informado, só esses tipos de usuária entram.
// =============================================================
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RotaProtegida({ perfis }) {
  const { usuario } = useAuth();
  const local = useLocation();

  // Sem login → vai para /login e lembra de onde veio (para voltar depois)
  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: local.pathname }} />;
  }

  // Logada, mas com perfil sem permissão → volta para a tela inicial dela
  if (perfis && !perfis.includes(usuario.tipo)) {
    return <Navigate to="/" replace />;
  }

  // Tudo certo: mostra a tela pedida (o <Outlet /> é a rota "filha")
  return <Outlet />;
}