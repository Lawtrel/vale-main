import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Eye, CheckCircle, Clock, AlertTriangle, Download } from "lucide-react";
import { useVales, Vale } from "@/hooks/useVales"; // Hook Firebase
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const BaixarVale = () => {
  const { buscarVales, baixarVale, loading: loadingHook } = useVales();
  const [vales, setVales] = useState<Vale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [transportadoraFiltro, setTransportadoraFiltro] = useState("");
  const [selectedVale, setSelectedVale] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVales = async () => {
      setLoading(true);
      setError(null);
      try {
        // Buscar vales pendentes do Firebase
        const data: Vale[] = await buscarVales("valescadastrados", "acumulado");

        // Atualizar status vencido se a data passou
        const hoje = new Date();
        const valesAtivos = data.map(v => ({
          ...v,
          status: new Date(v.dataVencimento) < hoje ? "vencido" : v.status || "acumulado",
        }));
        const valesVencidos = valesAtivos.filter(vale => vale.status === "vencido");
        const valesPendentes =  valesAtivos.filter(vale => vale.status !== "vencido");

        for (const vale of valesVencidos) {
          try {
            // Cria/atualiza o vale com ID definido
            await setDoc(doc(db, "valesvencidos", vale.id), vale);

            // Se não houver erro, remove da coleção original
            await deleteDoc(doc(db, "valescadastrados", vale.id));

            console.log(`Vale ${vale.id} movido para valesvencidos com sucesso!`);
          } catch (error) {
            console.error(`Erro ao mover o vale ${vale.id}:`, error);
          }
        }

        setVales(valesPendentes);
        console.log(valesVencidos);
      } catch (e) {
        console.error(e);
        setError("Falha ao carregar os vales do Firebase.");
      } finally {
        setLoading(false);
      }
    };

    fetchVales();
  }, []);

const darBaixa = async (id: string) => {
  try {
    // Busca o vale na lista atual
    const valeParaBaixar = vales.find(vale => vale.id === id);
    if (!valeParaBaixar) {
      toast({ title: "Erro", description: "Vale não encontrado", variant: "destructive" });
      return;
    }

    // Envia para processados e remove dos cadastrados no Firebase
    await baixarVale(id);

    // Atualiza o estado local removendo o vale processado
    setVales(old => old.filter(vale => vale.id !== id));

    toast({
      title: "✅ Vale processado com sucesso!",
      description: `Vale ${id} foi baixado e removido da lista pendente.`,
    });
  } catch (err) {
    console.error(err);
    toast({
      title: "Erro",
      description: "Falha ao processar o vale. Tente novamente.",
      variant: "destructive",
    });
  }
};


  const visualizarVale = (id: string) => {
    setSelectedVale(selectedVale === id ? null : id);
  };

  const valesFiltrados = vales.filter(vale => {
    const clienteMatch = vale.cliente.toLowerCase().includes(filtro.toLowerCase());
    const transportadoraMatch =  vale.transportadora.toLowerCase().includes(transportadoraFiltro.toLowerCase());
    return clienteMatch && transportadoraMatch;
  }).sort((a, b) => {
      const dataA = new Date(a.dataVencimento).getTime();
      const dataB = new Date(b.dataVencimento).getTime();
      return dataA - dataB; // mais próximo primeiro
    });;
  const transportadoras = Array.from(new Set(vales.map(vale => vale.transportadora ?? ""))).filter(t => t);

  const getStatusColor = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) return "text-red-600 bg-red-50";
    if (diffDays <= 3) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  const getStatusIcon = (dataVencimento: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) return <AlertTriangle className="w-4 h-4" />;
    if (diffDays <= 3) return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  if (loading) return <div className="p-6 text-center">Carregando vales...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <>
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Processar Vales Recebidos</h1>
            <p className="text-green-100">Gerencie e dê baixa nos vales palete recebidos</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{vales.filter(vale => new Date(vale.dataVencimento) >= new Date()).length}</div>
            <div className="text-green-200">Vales Ativos</div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">🔍 Buscar por Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Digite o nome do cliente..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="pl-10 h-12 border-2 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">🚛 Buscar por Transportadora</label>
              <Input
                  placeholder="Digite o nome da transportadora..."
                  value={transportadoraFiltro}
                  onChange={(e) => setTransportadoraFiltro(e.target.value)}
                  className="pl-10 h-12 border-2 focus:border-blue-500"
                />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium">
            📊 Encontrados {valesFiltrados.length} vale(s) correspondente(s) aos filtros aplicados
          </p>
        </div>

      {/* Vales List */}
      <div className="space-y-4">
        {valesFiltrados.map(vale => (
          <Card key={vale.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="font-mono text-lg px-3 py-1 bg-blue-50 border-blue-300">{`VP-${vale.id}`}</Badge>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vale.dataVencimento.toString())}`}>
                    {getStatusIcon(vale.dataVencimento.toString())}
                    {new Date(vale.dataVencimento) < new Date() ? 'Vencido' :
                     Math.ceil((new Date(vale.dataVencimento).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) <= 3 ? 'Vence em breve' : 'No prazo'}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => visualizarVale(vale.id)} className="hover:bg-blue-50">
                    <Eye className="w-4 h-4 mr-2" />
                    {selectedVale === vale.id ? 'Ocultar' : 'Visualizar'}
                  </Button>
                  <Button onClick={() => darBaixa(vale.id)} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="w-4 h-4 mr-2" /> Dar Baixa
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-xl text-gray-800 mb-3">{vale.cliente}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-600 block">🚛 Transportadora</span><p className="font-semibold text-gray-800">{vale.transportadora}</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-600 block">📦 Quantidade</span><p className="font-semibold text-gray-800">{vale.quantidade} paletes</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-600 block">📅 Vencimento</span><p className="font-semibold text-gray-800">{new Date(vale.dataVencimento).toLocaleDateString('pt-BR')}</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-600 block">💰 Valor</span><p className="font-semibold text-green-600">{`R$ ${((vale.valorUnitario || 0) * (vale.quantidade || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</p></div>
                </div>
                {selectedVale === vale.id && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in">
                    <h4 className="font-semibold text-gray-800 mb-2">📝 Detalhes Adicionais</h4>
                    <p className="text-gray-700 mb-4"><strong>Observações:</strong> {vale.observacoes}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="hover:bg-white"><Download className="w-4 h-4 mr-2"/> Baixar PDF</Button>
                      <Button variant="outline" size="sm" className="hover:bg-white">📧 Enviar Email</Button>
                      <Button variant="outline" size="sm" className="hover:bg-white">📋 Copiar Dados</Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    {/* Summary Footer */}
      {vales.length > 0 && (
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-800">{vales.length}</div>
                <div className="text-sm text-gray-600">Total de Vales Processados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  R${" "}
                  {vales
                    .reduce((acc, vale) => {
                      const valorUnitarioNum = vale.valorUnitario
                        ? Number(String(vale.valorUnitario).replace(/[R$\s\.]/g, "").replace(",", "."))
                        : 0;
                      const quantidadeNum = vale.quantidade || 0;
                      return acc + valorUnitarioNum * quantidadeNum;
                    }, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">Valor Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {vales.reduce((acc, vale) => acc + vale.quantidade, 0)}
                </div>
                <div className="text-sm text-gray-600">Total de Paletes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default BaixarVale;
