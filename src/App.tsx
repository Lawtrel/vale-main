import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CriarVale from './pages/CriarVale';
import ValesAcumulados from './pages/ValesAcumulados';
import ValesProcessados from './pages/ValesProcessados';
import ValesVencidos from './pages/ValesVencidos';
import BaixarVale from './pages/BaixarVale';
import ApontamentoVale from './pages/ApontamentoVale';
import CadastreSeADM from './pages/CadastreSeADM';
import LoginADM from './pages/LoginADM';
import AprovaADM from './pages/AprovaADM';
import NotFound from './pages/NotFound';
import { useAuth } from './hooks/useAuth';
import { useEffect, useState } from 'react';

function App() {
  const { user, loading } = useAuth();
  const [usuarioLogado, setUsuarioLogado] = useState<{ email: string; role: string } | null>(null);
    const [loadingUsuario, setLoadingUsuario] = useState(true);
  
  useEffect(() => {
    const usuarioInfo = localStorage.getItem("usuario");
    if (usuarioInfo) {
      try {
        const usuarioParse = JSON.parse(usuarioInfo);
        setUsuarioLogado({ email: usuarioParse.email, role: usuarioParse.role });
      } catch (error) {
        console.error("Erro ao ler usuário do localStorage", error);
        setUsuarioLogado(null);
      }
    } else {
      setUsuarioLogado(null);
    }
    setLoadingUsuario(false);
  }, []);

  if (loading || loadingUsuario) {
    return <div>Carregando Aplicação...</div>;
  }

  // Rota privada geral (usuario logado)
  const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    return user ? children : <Navigate to="/" />;
  };

  // Rota privada para admins
  const PrivateRouteAdm = ({ children }: { children: JSX.Element }) => {
    if (!usuarioLogado || usuarioLogado.role !== "adm") {
      return <Navigate to="/dashboard" />;
    }
    return children;
  };
  const PrivateRouteSupervisor = ({ children }: { children: JSX.Element }) => {
    if (usuarioLogado.role !== "supervisor" && usuarioLogado.role !== "adm") {
      return <Navigate to="/dashboard" />;
    }
    return children;
  };


  if (loading) {
    return <div>Carregando Aplicação...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<LoginADM />} />
        <Route path="/" element={<CadastreSeADM />} />

        {/* Rota "Pai" do Dashboard - Protegida e com o Layout */}
        <Route 
          path="/dashboard" 
          element={<PrivateRoute><Layout /></PrivateRoute>}
        >
          {/* Rotas "Filhas" que serão renderizadas dentro do Layout */}
          <Route index element={<Dashboard />} /> {/* Rota inicial: /dashboard */}
          <Route path="criar-vale" element={<PrivateRouteSupervisor><CriarVale /></PrivateRouteSupervisor>} /> {/* Rota: /dashboard/criar-vale */}
          <Route path="baixar-vale" element={<PrivateRouteSupervisor><BaixarVale /></PrivateRouteSupervisor>} /> {/* Rota: /dashboard/baixar-vale */}
          <Route path="vales-acumulados" element={<ValesAcumulados />} /> {/* Rota: /dashboard/vales-acumulados */}
          <Route path="vales-processados" element={<PrivateRouteSupervisor><ValesProcessados /></PrivateRouteSupervisor>} /> {/* Rota: /dashboard/vales-processados */}
          <Route path="vales-vencidos" element={<PrivateRouteSupervisor><ValesVencidos /></PrivateRouteSupervisor>} /> {/* Rota: /dashboard/vales-vencidos */}
          <Route path="apontamento" element={<PrivateRouteSupervisor><NotFound /></PrivateRouteSupervisor>} /> {/* Rota: /dashboard/apontamento */}
          <Route path="aprova-adm" element={<PrivateRouteAdm><AprovaADM /></PrivateRouteAdm>} /> {/* Rota: /dashboard/aprova-adm */}
        </Route>

        {/* Rota para página não encontrada */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;