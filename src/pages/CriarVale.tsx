import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { FormCreatePalet } from "@/components/ui/form-create-palet";
import { ResumoFinanceiro } from "@/components/ui/calculator-create-palet";
import { PreviewVale } from "@/components/ui/preview-create-palet";
import { AcoesRapidas } from "@/components/ui/quickactions-create-palet";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export interface Cliente {
  id: string;
  nome: string;
}
export interface Transportadora {
  id: string;
  nome: string;
}

type FormData = {
  cliente: string;
  transportadora: string;
  quantidade: string;
  dataVencimento: string;
  observacoes: string;
  valorUnitario: string;
};

const CriarVale = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    cliente: "",
    transportadora: "",
    quantidade: "0",
    dataVencimento: "",
    observacoes: "",
    valorUnitario: "0",
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        // --- CORREÇÃO AQUI: buscando doc.data().nome ---
        const qClientes = query(collection(db, "clientes"));
        const clientesSnap = await getDocs(qClientes);
        setClientes(clientesSnap.docs.map(doc => ({ id: doc.id, nome: doc.data().nome } as Cliente)));
        
        // --- CORREÇÃO AQUI: buscando doc.data().nome ---
        const qTransportadoras = query(collection(db, "transportadoras"));
        const transportadorasSnap = await getDocs(qTransportadoras);
        setTransportadoras(transportadorasSnap.docs.map(doc => ({ id: doc.id, nome: doc.data().nome } as Transportadora)));
      } catch (error) {
        toast({ title: "Erro ao carregar dados", variant: "destructive" });
      }
    };
    fetchDados();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const gerarVale = async () => {
    if (!formData.cliente || !formData.transportadora || !formData.quantidade || !formData.dataVencimento) {
      toast({ title: "⚠️ Campos obrigatórios", variant: "destructive" });
      return;
    }
    setLoading(true);
    const dataVencimentoCorreta = new Date(formData.dataVencimento);
    dataVencimentoCorreta.setDate(dataVencimentoCorreta.getDate() + 1 )
    const valeData = {
      cliente: formData.cliente,
      transportadora: formData.transportadora,
      quantidade: parseInt(formData.quantidade) || 0,
      valorUnitario: parseFloat(formData.valorUnitario) || 0,
      dataVencimento: dataVencimentoCorreta.toISOString(),
      observacoes: formData.observacoes || "",
      status: "acumulado",
      dataCriacao: new Date().toISOString(), 
    };

    try {
      await addDoc(collection(db, "valescadastrados"), valeData);
      toast({ title: "✅ Vale criado com sucesso!" });
      setFormData({
        cliente: "", transportadora: "", quantidade: "0", dataVencimento: "",
        observacoes: "", valorUnitario: "0",
      });
    } catch (error) {
      toast({ title: "❌ Erro ao criar vale", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Criar Novo Vale Palete</h1>
            <p className="text-blue-100">Gere novos vales palete de forma digital e eficiente</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center"><Plus className="w-8 h-8 text-white" /></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FormCreatePalet
          formData={formData}
          clientes={clientes}
          transportadoras={transportadoras}
          onInputChange={handleInputChange}
          onSubmit={gerarVale}
          isLoading={loading}
        />
        <div className="space-y-6">
          <ResumoFinanceiro
            quantidade={formData.quantidade}
            valorUnitario={formData.valorUnitario}
          />
          <PreviewVale
            cliente={formData.cliente}
            transportadora={formData.transportadora}
            quantidade={formData.quantidade}
            dataVencimento={formData.dataVencimento}
            valorUnitario={formData.valorUnitario}
            observacoes={formData.observacoes}
          />
          <AcoesRapidas clientePreenchido={!!formData.cliente} formData={formData} />
          <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
            <CardContent className="p-6">
              <h4 className="font-semibold text-orange-800 mb-3">💡 Dicas</h4>
              <ul className="text-sm text-orange-700 space-y-2">
                <li>• Configure lembretes automáticos</li>
                <li>• Use QR Code para rastreamento</li>
                <li>• Integre com o sistema de estoque</li>
                <li>• Mantenha histórico completo</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CriarVale;