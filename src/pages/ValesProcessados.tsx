import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, Search, Filter } from "lucide-react";
import { useVales, Vale } from '@/hooks/useVales'; // Importando nosso hook do Firebase
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Importando o Label
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ValesProcessados = () => {
  const { buscarVales, loading } = useVales(); // Usando o hook
  const [vales, setVales] = useState<Vale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [transportadoraFiltro, setTransportadoraFiltro] = useState("");
  const [selectedVale, setSelectedVale] = useState<string | null>(null);

  useEffect(() => {
    const fetchVales = async () => {
      setError(null);
      try {
        // A mágica acontece aqui: buscando os vales 'processados' do Firebase
        const data = await buscarVales('valesprocessados', 'processado');
        setVales(data);
        console.log(data)
      } catch (e) {
        setError("Falha ao carregar os vales processados.");
      }
    };
    fetchVales();
  }, []); // O array vazio garante que a busca ocorra apenas uma vez

  const visualizarVale = (id: string) => {
    setSelectedVale(selectedVale === id ? null : id);
  };

  const baixarPDF = (vale: Vale) => {
    const doc = new jsPDF();
    const dataVencimentoFormatada = vale.dataVencimento
        ? new Date(vale.dataVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        : '-';

    doc.setFontSize(18);
    doc.text(`Detalhes do Vale Processado - VP-${vale.id}`, 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [["Campo", "Valor"]],
      body: [
        ["Cliente", vale.cliente || "-"],
        ["Transportadora", vale.transportadora || "-"],
        ["Quantidade", `${vale.quantidade || 0} paletes`],
        ["Valor Unitário", `R$ ${vale.valorUnitario?.toFixed(2) || '0.00'}`],
        ["Data de Vencimento", dataVencimentoFormatada],
        ["Observações", vale.observacoes || "-"]
      ],
      theme: 'striped'
    });

    doc.save(`vale-processado-${vale.id}.pdf`);
  };

  const valesFiltrados = vales.filter(vale => {
    const clienteMatch = vale.cliente.toLowerCase().includes(filtro.toLowerCase());
    const transportadoraMatch =  vale.transportadora.toLowerCase().includes(transportadoraFiltro.toLowerCase());
    return clienteMatch && transportadoraMatch;
  });

  if (loading) return <div className="p-6 text-center">Carregando vales processados...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <>
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Vales Processados</h1>
            <p className="text-green-100">Visualize e baixe os vales que já foram concluídos</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{vales.length}</div>
            <div className="text-green-200">Total de Vales Concluídos</div>
          </div>
        </div>
      </div>

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
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                🔍 Buscar por Cliente
              </Label>
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
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                🚛 Buscar por Transportadora
              </Label>
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

      <div className="space-y-4">
        {valesFiltrados.length > 0 ? valesFiltrados.map((vale) => (
          <Card key={vale.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <Badge variant="outline" className="font-mono text-lg px-3 py-1 bg-green-50 border-green-300">
                  {`VP-${vale.id}`}
                </Badge>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => visualizarVale(vale.id || '')} className="hover:bg-blue-50">
                    <Eye className="w-4 h-4 mr-2" />
                    {selectedVale === vale.id ? 'Ocultar' : 'Visualizar'}
                  </Button>
                  <Button onClick={() => baixarPDF(vale)} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              </div>
              <h3 className="font-bold text-xl text-gray-800 mb-3">{vale.cliente}</h3>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-600 block">🚛 Transportadora</span><p className="font-semibold text-gray-800">{vale.transportadora}</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-600 block">📦 Quantidade</span><p className="font-semibold text-gray-800">{vale.quantidade} paletes</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-600 block">📅 Vencimento</span><p className="font-semibold text-gray-800">{new Date(vale.dataVencimento).toLocaleDateString('pt-BR')}</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><span className="text-sm font-medium text-gray-600 block">💰 Valor</span><p className="font-semibold text-green-600">{`R$ ${((vale.valorUnitario || 0) * (vale.quantidade || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</p></div>
              </div>
              {selectedVale === vale.id && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-800 mb-2">📝 Detalhes Adicionais</h4>
                      <p className="text-gray-700"><strong>Observações:</strong> {vale.observacoes || "Nenhuma observação."}</p>
                  </div>
              )}
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Nenhum vale processado encontrado.
            </CardContent>
          </Card>
        )}
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

export default ValesProcessados;