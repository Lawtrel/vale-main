import { NavLink } from "react-router-dom";
import {
  BarChart,
  FileText,
  AlertTriangle,
  Archive,
  Plus,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar-button/sidebar";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart,
    description: "Visão geral e métricas",
    color: "text-blue-600",
    border: "border-r-4 bg-gray-50 border-blue-600",
    noborder: "border-r-4 bg-gray-50 border-gray-400",
  },
  {
    title: "Processar Vales",
    url: "/dashboard/baixar-vale",
    icon: FileText,
    description: "Dar baixa em vales recebidos",
    color: "text-green-600",
    border: "border-r-4 bg-gray-50 border-green-600",
    noborder: "border-r-4 bg-gray-50 border-gray-400",
  },
  {
    title: "Vales Vencidos",
    url: "/dashboard/vales-vencidos",
    icon: AlertTriangle,
    description: "Acompanhar pendências",
    color: "text-red-600",
    border: "border-r-4 bg-gray-50 border-red-600",
    noborder: "border-r-4 bg-gray-50 border-gray-400",
  },
  {
    title: "Vales Acumulados",
    url: "/dashboard/vales-acumulados",
    icon: Archive,
    description: "Controle de estoque",
    color: "text-purple-600",
    border: "border-r-4 bg-gray-50 border-purple-600",
    noborder: "border-r-4 bg-gray-50 border-gray-400",
  },
  {
    title: "Apontamentos",
    url: "/dashboard/apontamento",
    icon: Calendar,
    description: "Registrar movimentações",
    color: "text-orange-600",
    border: "border-r-4 bg-gray-50 border-orange-600",
    noborder: "border-r-4 bg-gray-50 border-gray-400",
  },
  {
    title: "Criar Vale",
    url: "/dashboard/criar-vale",
    icon: Plus,
    description: "Gerar novos vales",
    color: "text-indigo-600",
    border: "border-r-4 bg-gray-50 border-indigo-600",
    noborder: "border-r-4 bg-gray-50 border-gray-400",
  },
  {
    title: "Vales Processados",
    url: "/dashboard/vales-processados",
    icon: FileText,
    description: "Verificar vales processados",
    color: "text-blue-600",
    border: "border-r-4 bg-gray-50 border-blue-600",
    noborder: "border-r-4 bg-gray-50 border-gray-400",
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const handleFocus = (itemTitle: string) => {
    setActiveItem(itemTitle); // Atualiza o item ativo ao clicar
  };
  const collapsed = state === "collapsed";
  const [usuarioLogado, setUsuarioLogado] = useState<{ email: string; role: string } | null>(null);
    const [status, setStatus] = useState({
    ativos: 0,
    processadosHoje: 0,
    vencidos: 0,
  });
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
    }
  }, []);
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // 🔹 Vales ativos (em valescadastrados, por exemplo)
        const ativosSnap = await getDocs(collection(db, "valescadastrados"));
        const ativosCount = ativosSnap.size;

        // 🔹 Vales processados hoje (em valesprocessados, filtrando por data)
        const hoje = new Date().toISOString().split("T")[0];
        const processadosSnap = await getDocs(
          query(
            collection(db, "valesprocessados"),
            where("dataProcessado", "==", hoje) // precisa ter esse campo salvo
          )
        );
        const processadosCount = processadosSnap.size;

        // 🔹 Vales vencidos
        const vencidosSnap = await getDocs(collection(db, "valesvencidos"));
        const vencidosCount = vencidosSnap.size;

        setStatus({
          ativos: ativosCount,
          processadosHoje: processadosCount,
          vencidos: vencidosCount,
        });
        setOnline(true)
      } catch (err) {
        console.error("Erro ao buscar status do sistema:", err);
        setOnline(false)
      }
    };

    fetchStatus();
  }, []);

  const menuFiltrado = menuItems.filter((item) => {
    if (!usuarioLogado) return false;

    // Itens exclusivos para adm
    const admOnly = ["AprovaADM"];
    // Itens exclusivos para supervisor
    const supervisorOnly = ["BaixarVale", "CriarVale", "ApontamentoVale", "ValesVencidos"];

    // Aqui você precisa relacionar títulos com roles
    if (item.title === "Dashboard") return true;
    if (item.title === "Vales Acumulados") return true; // Dashboard visível para todos
    if (usuarioLogado.role === "adm") return true; // Adm vê tudo
    if (usuarioLogado.role === "supervisor") {
      // Supervisor não vê itens de admin, mas vê supervisorOnly
      if (admOnly.includes(item.title)) return false;
      return true;
    }

    // Outros roles não vêem nada
    return false;
  });
  return (
    <Sidebar className="border-r border-gray-200 bg-white shadow-lg">
      <SidebarHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">VP</span>
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Vale Palete
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Sistema Digital
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-6">
                <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold px-3 mb-4">
            Administração de Paletes
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuFiltrado.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="group">
                    <NavLink to={item.url} end>
                      {({ isActive }) => (
                        <>
                          <div
                            className={`absolute right-0 top-1 bottom-1 w-3 rounded-2xl transition-all duration-300 ease-in-out ${
                              isActive ? item.border : item.noborder
                            }`}
                          ></div>
                          <item.icon
                            className={
                              isActive
                                ? item.color
                                : "text-gray-400 group-hover:text-gray-600"
                            }
                          />
                          <span className="flex-1 ml-3 text-sm truncate">
                            {item.title}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Seção de estatísticas e badges — permanece igual */}
        {!collapsed && (
          <div className="mt-8 px-3">
            <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-xl p-5 border border-green-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-bold text-gray-800">
                  Status do Sistema
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vales Ativos:</span>
                  <span className="font-bold text-green-600">{status.ativos}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Processados Hoje:</span>
                  <span className="font-bold text-blue-600">{status.processadosHoje}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vencidos:</span>
                  <span className="font-bold text-red-600">{status.vencidos}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className={`flex items-center gap-2 text-xs ${online ? "text-green-700" : "text-red-700"} font-medium`}>
                  <div className={`w-2 h-2 ${online ? "bg-green-500" : "bg-red-500"} rounded-full animate-pulse`}></div>
                  { online ? "Sistema Online" : "Sistema Offline"}
                </div>
              </div>
            </div>
          </div>
        )}

        {!collapsed && (
          <div className="mt-6 px-3">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏆</span>
                <h3 className="text-sm font-bold text-orange-800">
                  Conversão Digital
                </h3>
              </div>
              <p className="text-xs text-orange-700 mb-3">
                Transformando processos manuais em soluções digitais eficientes
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-green-700 font-medium flex items-center gap-1">
                  <span>✓</span> Sem papel
                </div>
                <div className="text-green-700 font-medium flex items-center gap-1">
                  <span>✓</span> Tempo real
                </div>
                <div className="text-green-700 font-medium flex items-center gap-1">
                  <span>✓</span> Histórico
                </div>
                <div className="text-green-700 font-medium flex items-center gap-1">
                  <span>✓</span> Mobilidade
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
