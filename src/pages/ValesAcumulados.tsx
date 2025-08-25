import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useEffect, useState } from "react";
import { useVales, Vale } from '@/hooks/useVales';
import { Badge } from "@/components/ui/badge";

// Tipos para os dados agregados
type AgrupamentoCliente = { nome: string; vales: number; paletes: number; valor: number; };
type AgrupamentoTransportadora = { nome: string; vales: number; paletes: number; };

const ValesAcumulados = () => {
  const { buscarVales, loading } = useVales();
  const [vales, setVales] = useState<Vale[]>([]);
  const [clientesAgregados, setClientesAgregados] = useState<AgrupamentoCliente[]>([]);
  const [transportadorasAgregadas, setTransportadorasAgregadas] = useState<AgrupamentoTransportadora[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVales = async () => {
      setError(null);
      try {
        const data = await buscarVales('valescadastrados', 'acumulado');
        setVales(data);

        // --- Agrupar por cliente ---
        const clientesMap = new Map<string, AgrupamentoCliente>();
        // --- Agrupar por transportadora ---
        const transportadorasMap = new Map<string, AgrupamentoTransportadora>();

        data.forEach(vale => {
          const clienteAtual = clientesMap.get(vale.cliente) || { nome: vale.cliente, vales: 0, paletes: 0, valor: 0 };
          clienteAtual.vales++;
          clienteAtual.paletes += vale.quantidade;
          clienteAtual.valor += vale.quantidade * (vale.valorUnitario || 0);
          clientesMap.set(vale.cliente, clienteAtual);

          const transpNome = vale.transportadora || "Sem Transportadora";
          const transpAtual = transportadorasMap.get(transpNome) || { nome: transpNome, vales: 0, paletes: 0 };
          transpAtual.vales++;
          transpAtual.paletes += vale.quantidade;
          transportadorasMap.set(transpNome, transpAtual);
        });

        setClientesAgregados(Array.from(clientesMap.values()).sort((a, b) => b.valor - a.valor));
        setTransportadorasAgregadas(Array.from(transportadorasMap.values()).sort((a, b) => b.paletes - a.paletes));

      } catch (e) {
        console.error(e);
        setError("Falha ao carregar os vales.");
      }
    };

    fetchVales();
  }, []);

  if (loading) return <div className="p-6 text-center">Carregando dados...</div>
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  const totalVales = vales.length;
  const totalPaletes = vales.reduce((acc, vale) => acc + vale.quantidade, 0);
  const valorEstimado = vales.reduce((acc, vale) => acc + vale.quantidade * (vale.valorUnitario || 0), 0);

  const pieData = clientesAgregados.map(c => ({ name: c.nome, value: c.paletes }));
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308'];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vale Paletes Acumulados</h1>
        <p className="text-gray-600">Visualização dos vales em aberto por cliente e transportadora</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100"><CardHeader className="pb-2"><CardTitle className="text-blue-700">Total de Vales</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-800">{totalVales}</p><p className="text-sm text-blue-600">Em aberto</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100"><CardHeader className="pb-2"><CardTitle className="text-green-700">Total de Paletes</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-800">{totalPaletes}</p><p className="text-sm text-green-600">Aguardando retorno</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100"><CardHeader className="pb-2"><CardTitle className="text-purple-700">Valor Estimado</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-purple-800">R$ {(valorEstimado / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} K</p><p className="text-sm text-purple-600">Em circulação</p></CardContent></Card>
      </div>

      <Tabs defaultValue="clientes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clientes">Por Cliente</TabsTrigger>
          <TabsTrigger value="transportadoras">Por Transportadora</TabsTrigger>
        </TabsList>

        {/* --- Por Cliente --- */}
        <TabsContent value="clientes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Distribuição por Cliente</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value" nameKey="name">
                      {pieData.map((_entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} paletes`, 'Quantidade']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Ranking de Clientes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {clientesAgregados.slice(0, 5).map((cliente, index) => (
                  <div key={cliente.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs">#{index + 1}</Badge><p className="font-medium text-gray-800">{cliente.nome}</p></div>
                      <p className="text-sm text-gray-600">{cliente.vales} vales • {cliente.paletes} paletes</p>
                    </div>
                    <div className="text-right"><p className="font-semibold text-gray-800">R$ {cliente.valor}</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Por Transportadora --- */}
        <TabsContent value="transportadoras" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Vales por Transportadora</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={transportadorasAgregadas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" fontSize={10} angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="vales" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Ranking de Transportadoras</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {transportadorasAgregadas.slice(0, 5).map((transp, index) => (
                  <div key={transp.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${index === 0 ? 'bg-green-100 text-green-800' : ''}`}>#{index + 1}</Badge>
                        <p className="font-medium text-gray-800">{transp.nome}</p>
                      </div>
                      <p className="text-sm text-gray-600">{transp.paletes} paletes em circulação</p>
                    </div>
                    <div className="text-right"><p className="font-semibold text-gray-800">{transp.vales} vales</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ValesAcumulados;
