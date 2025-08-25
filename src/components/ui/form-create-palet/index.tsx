import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Cliente, Transportadora } from "@/pages/CriarVale";
import ClienteSearch from "@/components/ClientSearch";
import TransportadoraSearch from "@/components/TransportadoraSearch";
import { FileText, Plus, Save } from "lucide-react";
import { useToast } from "../use-toast";
import { useEffect } from "react";

// Interface atualizada para corresponder ao que 'CriarVale' envia
interface FormCreatePaletProps {
  formData: {
    cliente: string;
    transportadora: string;
    quantidade: string;
    dataVencimento: string;
    observacoes: string;
    valorUnitario: string;
  };
  clientes: Cliente[];
  transportadoras: Transportadora[];
  onInputChange: (field: string, value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function FormCreatePalet({
  formData,
  clientes,
  transportadoras,
  onInputChange,
  onSubmit,
  isLoading,
}: FormCreatePaletProps) {
  const { toast } = useToast();
  const DRAFT_KEY = "formCreatePalet_draft";

  const salvarRascunho = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    toast({
      title: "💾 Rascunho salvo",
      description: "Os dados foram salvos localmente.",
    });
  };
   // 🔹 Carregar rascunho salvo no primeiro render
    useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        // percorre as chaves do rascunho e atualiza o formulário
        Object.keys(parsedDraft).forEach((key) => {
          onInputChange(key, parsedDraft[key as keyof typeof parsedDraft]);
        });
        toast({
          title: "📂 Rascunho carregado",
          description: "Dados recuperados do último rascunho salvo.",
        });
      } catch (err) {
        console.error("Erro ao carregar rascunho:", err);
      }
    }
    }, []);

  // --- ESTA É A CORREÇÃO CRUCIAL ---
  // Esta função recebe o cliente selecionado e informa a página principal
  const handleClienteSelect = (cliente: Cliente) => {
    onInputChange("cliente", cliente.nome);
  };
  
  // Esta função recebe a transportadora selecionada e informa a página principal
  const handleTransportadoraSelect = (transportadora: Transportadora) => {
    onInputChange("transportadora", transportadora.nome);
  };

  return (
    <div className="lg:col-span-2">
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <FileText className="h-5 w-5 text-blue-600" />
            Dados do Vale Palete
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Cliente *</Label>
                {/* O componente de busca agora chama a função correta */}
                <ClienteSearch 
                  clientes={clientes}
                  onClientSelect={handleClienteSelect}
                />
              </div>
              <div>
                <Label>Transportadora *</Label>
                {/* O componente de busca agora chama a função correta */}
                <TransportadoraSearch 
                  transportadoras={transportadoras}
                  onTransportadoraSelect={handleTransportadoraSelect}
                />
              </div>
          </div>

          <div className="md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="valorUnitario" className="mb-2 block font-medium text-gray-700">Valor Unitário (R$)</Label>
              <Input id="valorUnitario" type="number" placeholder="0.00" step="0.01" value={formData.valorUnitario} onChange={(e) => onInputChange("valorUnitario", e.target.value)} className="h-12" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">📦 Quantidade de Paletes *</Label>
              <Input
                type="number"
                placeholder="Ex: 15"
                value={formData.quantidade}
                onChange={(e) => onInputChange("quantidade", e.target.value)}
                className="h-12 border-2 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">📅 Data de Vencimento *</Label>
              <Input
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => onInputChange("dataVencimento", e.target.value)}
                min={new Date().toISOString().split("T")[0]} // não permite datas anteriores
                className="h-12 border-2 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">📝 Observações</Label>
            <textarea
              placeholder="Informações adicionais..."
              value={formData.observacoes}
              onChange={(e) => onInputChange("observacoes", e.target.value)}
              className="w-full h-24 px-3 py-2 border-2 border-gray-200 rounded-md focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onSubmit}
              disabled={isLoading}
              className="flex-1 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isLoading ? 'Gerando...' : 'Gerar Vale Palete'}
            </Button>
            <Button variant="outline" className="h-12 px-6 border-2 hover:bg-gray-50" onClick={salvarRascunho}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Rascunho
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}