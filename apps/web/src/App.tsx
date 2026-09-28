import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './components/ToastProvider.js';
import { RoleRoute, roleHome } from './routes/RoleRoute.js';
import { ClienteLayout } from './layouts/ClienteLayout.js';
import { ProfLayout } from './layouts/ProfLayout.js';
import { Agenda as ProfAgenda } from './pages/profissional/Agenda.js';
import { Financeiro as ProfFinanceiro } from './pages/profissional/Financeiro.js';
import { Servicos as ProfServicos } from './pages/profissional/Servicos.js';
import { Perfil as ProfPerfil } from './pages/profissional/Perfil.js';
import { AdminLayout } from './layouts/AdminLayout.js';
import { Painel as AdminPainel } from './pages/admin/Painel.js';
import { Profissionais as AdminProfissionais } from './pages/admin/Profissionais.js';
import { Clientes as AdminClientes } from './pages/admin/Clientes.js';
import { Financeiro as AdminFinanceiro } from './pages/admin/Financeiro.js';
import { Config as AdminConfig } from './pages/admin/Config.js';
import { Perfil as AdminPerfil } from './pages/admin/Perfil.js';
import { Login } from './pages/Login.js';
import { Legal } from './pages/Legal.js';
import { PlaceholderScreen } from './pages/PlaceholderScreen.js';
import { Home } from './pages/cliente/Home.js';
import { Search } from './pages/cliente/Search.js';
import { ProfessionalDetail } from './pages/cliente/ProfessionalDetail.js';
import { Booking } from './pages/cliente/Booking.js';
import { Appointments } from './pages/cliente/Appointments.js';
import { Profile } from './pages/cliente/Profile.js';
import { FavoritesProvider } from './features/discovery/FavoritesContext.js';
import { SearchFiltersProvider } from './features/discovery/SearchFiltersContext.js';
import { BookingProvider } from './features/booking/BookingContext.js';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? roleHome(user.role) : '/login'} replace />;
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/legal" element={<Legal />} />

          <Route element={<RoleRoute role="cliente" />}>
            <Route
              element={
                <FavoritesProvider>
                  <SearchFiltersProvider>
                    <BookingProvider>
                      <ClienteLayout />
                    </BookingProvider>
                  </SearchFiltersProvider>
                </FavoritesProvider>
              }
            >
              <Route path="/cliente" element={<Home />} />
              <Route path="/cliente/explorar" element={<Search />} />
              <Route path="/cliente/profissional/:id" element={<ProfessionalDetail />} />
              <Route path="/cliente/agendar" element={<Booking />} />
              <Route path="/cliente/agenda" element={<Appointments />} />
              <Route path="/cliente/perfil" element={<Profile />} />
            </Route>
          </Route>

          <Route element={<RoleRoute role="profissional" />}>
            <Route element={<ProfLayout />}>
              <Route path="/profissional" element={<PlaceholderScreen title="Início" />} />
              <Route path="/profissional/agenda" element={<ProfAgenda />} />
              <Route path="/profissional/financeiro" element={<ProfFinanceiro />} />
              <Route path="/profissional/servicos" element={<ProfServicos />} />
              <Route path="/profissional/perfil" element={<ProfPerfil />} />
            </Route>
          </Route>

          <Route element={<RoleRoute role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminPainel />} />
              <Route path="/admin/profissionais" element={<AdminProfissionais />} />
              <Route path="/admin/clientes" element={<AdminClientes />} />
              <Route path="/admin/financeiro" element={<AdminFinanceiro />} />
              <Route path="/admin/config" element={<AdminConfig />} />
              <Route path="/admin/perfil" element={<AdminPerfil />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
