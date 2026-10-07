// =============================================================
// App.jsx — Mapa de rotas (qual URL abre qual tela).
//
// Telas do wireframe:
//   01 Cadastro ............ /cadastro
//   02 Login ............... /login
//   03 Meus plantios ....... /plantios
//   04 Cadastrar plantio ... /plantios/novo  e  /plantios/:id/editar
//   05 Calendário agrícola . /calendario
//   06 Dashboard comunidade  /comunidade
//   07 Validação ........... (dentro da tela 04: mensagens de erro/sucesso)
//   08 Coordenadora ........ /coordenadora
// =============================================================
import { Navigate, Route, Routes } from 'react-router-dom';
import RotaProtegida from './components/RotaProtegida';
import { useAuth } from './context/AuthContext';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import MeusPlantios from './pages/MeusPlantios';
import FormPlantio from './pages/FormPlantio';
import Calendario from './pages/Calendario';
import Dashboard from './pages/Dashboard';
import Coordenadora from './pages/Coordenadora';
import NaoEncontrada from './pages/NaoEncontrada';

/** Decide a "tela inicial" de acordo com quem está logada. */
function Inicio() {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  return <Navigate to={usuario.tipo === 'COORDENADORA' ? '/coordenadora' : '/plantios'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />

      {/* Telas públicas (não precisam de login) */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* Telas exclusivas da agricultora */}
      <Route element={<RotaProtegida perfis={['AGRICULTORA']} />}>
        <Route path="/plantios" element={<MeusPlantios />} />
        <Route path="/plantios/novo" element={<FormPlantio />} />
        <Route path="/plantios/:id/editar" element={<FormPlantio />} />
      </Route>

      {/* Telas para qualquer pessoa logada */}
      <Route element={<RotaProtegida />}>
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/comunidade" element={<Dashboard />} />
      </Route>

      {/* Tela exclusiva da coordenadora */}
      <Route element={<RotaProtegida perfis={['COORDENADORA']} />}>
        <Route path="/coordenadora" element={<Coordenadora />} />
      </Route>

      {/* Qualquer outro endereço */}
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}