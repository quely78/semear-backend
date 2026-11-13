// =============================================================
// App.jsx — Mapa de rotas (qual URL abre qual tela).
//
// Telas do wireframe:
//   01 Cadastro ............ /cadastro
//   02 Login ............... /login
//   03 Meus plantios ....... /plantios
//   04 Cadastrar plantio ... /plantios/novo  e  /plantios/:id/editar
//   05 Calendário agrícola . /calendario
//      └ Calendário de um plantio /plantios/:id/calendario
//   06 Dashboard comunidade  /comunidade
//   07 Validação ........... (dentro da tela 04: mensagens de erro/sucesso)
//   08 Responsável pela comunidade /coordenadora
//      └ Agricultoras da comunidade /coordenadora/agricultoras
//        (com "Redefinir senha", que gera uma senha provisória)
//   09 Estoque (plantio = entrada, colheita = saída)
//      /coordenadora/estoque (só a responsável pela comunidade)
//   10 Criar senha nova (após senha provisória) /trocar-senha
//   11 Esqueci minha senha ... /esqueci-senha
//   12 Meu perfil ............ /perfil (tocar no "Olá, Nome" do cabeçalho)
//      └ Link do e-mail ...... /redefinir-senha?token=...
//   13 Finanças (agricultora)
//      Dinheiro do plantio ... /plantios/:id/dinheiro (aba ao lado do Calendário)
//      Gastos ................ /plantios/:id/gastos
//      Vendas ................ /plantios/:id/vendas
//      Qual plantio rende mais /plantios/rendimento
//      Relatório (Pronaf) .... /plantios/relatorio
//   14 Vendas da comunidade .. /coordenadora/vendas (só totais)
// =============================================================
import { Navigate, Route, Routes } from 'react-router-dom';
import RotaProtegida from './components/RotaProtegida';
import { useAuth } from './context/AuthContext';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import MeusPlantios from './pages/MeusPlantios';
import FormPlantio from './pages/FormPlantio';
import CalendarioPlantio from './pages/CalendarioPlantio';
import Estoque from './pages/Estoque';
import TrocarSenha from './pages/TrocarSenha';
import Perfil from './pages/Perfil';
import EsqueciSenha from './pages/EsqueciSenha';
import CriarSenhaNova from './pages/CriarSenhaNova';
import Calendario from './pages/Calendario';
import Dashboard from './pages/Dashboard';
import Coordenadora from './pages/Coordenadora';
import Agricultoras from './pages/Agricultoras';
import NaoEncontrada from './pages/NaoEncontrada';
import DinheiroPlantio from './pages/DinheiroPlantio';
import GastosPlantio from './pages/GastosPlantio';
import VendasPlantio from './pages/VendasPlantio';
import Rendimento from './pages/Rendimento';
import RelatorioFinanceiro from './pages/RelatorioFinanceiro';
import VendasComunidade from './pages/VendasComunidade';

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
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<CriarSenhaNova />} />

      {/* Telas exclusivas da agricultora */}
      <Route element={<RotaProtegida perfis={['AGRICULTORA']} />}>
        <Route path="/plantios" element={<MeusPlantios />} />
        <Route path="/plantios/novo" element={<FormPlantio />} />
        <Route path="/plantios/:id/editar" element={<FormPlantio />} />
        <Route path="/plantios/:id/calendario" element={<CalendarioPlantio />} />
        <Route path="/plantios/:id/dinheiro" element={<DinheiroPlantio />} />
        <Route path="/plantios/:id/gastos" element={<GastosPlantio />} />
        <Route path="/plantios/:id/vendas" element={<VendasPlantio />} />
        <Route path="/plantios/rendimento" element={<Rendimento />} />
        <Route path="/plantios/relatorio" element={<RelatorioFinanceiro />} />
      </Route>

      {/* Telas para qualquer pessoa logada */}
      <Route element={<RotaProtegida />}>
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/comunidade" element={<Dashboard />} />
        <Route path="/trocar-senha" element={<TrocarSenha />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>

      {/* Telas exclusivas da responsável pela comunidade (COORDENADORA) */}
      <Route element={<RotaProtegida perfis={['COORDENADORA']} />}>
        <Route path="/coordenadora" element={<Coordenadora />} />
        <Route path="/coordenadora/agricultoras" element={<Agricultoras />} />
        <Route path="/coordenadora/estoque" element={<Estoque />} />
        <Route path="/coordenadora/vendas" element={<VendasComunidade />} />
      </Route>

      {/* Qualquer outro endereço */}
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
