// src/pages/ValesVencidos.tsx

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

// Importações do Firebase
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

interface ValePayload {
  id: string;
  transportadora: string;
  cliente: string;
  quantidade: number;
  valorUnitario: number;
  dataVencimento: string;
  dataCriacao: string;
  status: string;
  observacoes?: string;
}

interface ValeVencido extends ValePayload {
    diasVencido: number;
}

const ValesVencidos = () => {
  const navigate = useNavigate();
  const [valesVencidos, setValesVencidos] = useState<ValeVencido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [valeSelecionado, setValeSelecionado] = useState<ValeVencido | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setOrganizationId(user.uid);
      } else {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);
  
  useEffect(() => {
      const fetchValesVencidos = async () => {
        if (!organizationId) return;

        setLoading(true);
        setError(null);

        try {
          const q = query(
            collection(db, "valesvencidos")
          );
          const snapshot = await getDocs(q);

          const data: ValeVencido[] = snapshot.docs
            .map(doc => {
              const docData = doc.data();
              if (!docData) return null;

              let dataVenc = docData.dataVencimento instanceof Timestamp
                ? docData.dataVencimento.toDate()
                : new Date(docData.dataVencimento);

              const hoje = new Date();
              hoje.setHours(0, 0, 0, 0);
              dataVenc.setHours(0, 0, 0, 0);

              const diffTime = hoje.getTime() - dataVenc.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

              return {
                id: doc.id,
                ...docData,
                dataVencimento: dataVenc.toISOString(),
                dataCriacao: docData.dataCriacao instanceof Timestamp
                  ? docData.dataCriacao.toDate().toISOString()
                  : new Date(docData.dataCriacao).toISOString(),
                diasVencido: diffDays > 0 ? diffDays : 0,
              } as ValeVencido;
            })
          setValesVencidos(data);
          console.log(snapshot)
        } catch (e) {
          setError("Falha ao carregar os vales vencidos.");
          console.error(e);
        } finally {
          setLoading(false);
        }
      };


    if (organizationId) {
        fetchValesVencidos();
    }
  }, [organizationId]);

  const getBadgeColor = (dias: number) => {
    if (dias <= 3) return "bg-orange-100 text-orange-800 border-orange-300";
    if (dias <= 7) return "bg-red-100 text-red-800 border-red-300";
    return "bg-red-200 text-red-900 border-red-400";
  };

  if (loading) return <div className="p-6 text-center">Carregando vales vencidos...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  const maxDiasVencido = valesVencidos.length > 0 ? Math.max(...valesVencidos.map(vale => vale.diasVencido)) : 0;

  const confirmarContato = (vale: ValeVencido) => {
  setValeSelecionado(vale);
  setOpenModal(true);
};

const darBaixaVale = async () => {
  if (!valeSelecionado) return;

  try {
    // Move para valesprocessados
    await setDoc(doc(db, "valesprocessados", valeSelecionado.id), {
      ...valeSelecionado,
      status: "processado",
      dataProcessado: new Date().toISOString(),
    });

    // Remove de valesvencidos
    await deleteDoc(doc(db, "valesvencidos", valeSelecionado.id));

    // Atualiza estado
    setValesVencidos(prev => prev.filter(v => v.id !== valeSelecionado.id));

    toast({
      title: "✅ Vale processado",
      description: `O vale ${valeSelecionado.id} foi movido para processados.`,
    });
  } catch (error) {
    console.error("Erro ao processar vale:", error);
    toast({
      title: "Erro",
      description: "Falha ao mover o vale. Tente novamente.",
      variant: "destructive",
    });
  } finally {
    setOpenModal(false);
    setValeSelecionado(null);
  }
};


  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Vale Paletes Vencidos</h1>
        <p className="text-gray-600">Vales que ultrapassaram o prazo de validade</p>
      </div>

      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          <strong>Atenção:</strong> Existem {valesVencidos.length} vales vencidos que precisam de ação imediata.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-700">Resumo dos Vales Vencidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg"><p className="text-2xl font-bold text-red-800">{valesVencidos.length}</p><p className="text-sm text-red-600">Total de Vales</p></div>
            <div className="text-center p-4 bg-red-50 rounded-lg"><p className="text-2xl font-bold text-red-800">{valesVencidos.reduce((acc, vale) => acc + vale.quantidade, 0)}</p><p className="text-sm text-red-600">Paletes em Atraso</p></div>
            <div className="text-center p-4 bg-red-50 rounded-lg"><p className="text-2xl font-bold text-red-800">{maxDiasVencido}</p><p className="text-sm text-red-600">Dias do Maior Atraso</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {valesVencidos.map((vale) => (
          <Card key={vale.id} className="border-red-200 bg-red-50/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3"><Badge variant="outline" className="font-mono border-red-300">{`VP-${vale.id}`}</Badge><h3 className="font-semibold text-lg text-gray-800">{vale.cliente}</h3><Badge className={getBadgeColor(vale.diasVencido)}>{vale.diasVencido} dias vencido</Badge></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                    <div><span className="font-medium">Transportadora:</span><p>{vale.transportadora}</p></div>
                    <div><span className="font-medium">Quantidade:</span><p className="text-red-700 font-semibold">{vale.quantidade} paletes</p></div>
                    <div><span className="font-medium">Data de Vencimento:</span><p className="text-red-700 font-semibold">{new Date(vale.dataVencimento).toLocaleDateString("pt-BR")}</p></div>
                  </div>
                </div>
                <div className="flex flex-col gap-2"><Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => confirmarContato(vale)}>Contatar Cliente</Button><Button size="sm" className="bg-red-600 hover:bg-red-700">Ação Emergencial</Button></div>
                {openModal && valeSelecionado && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Cliente já foi contatado?
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Deseja dar baixa no vale <strong>{valeSelecionado.id}</strong> e mover para processados?
                      </p>
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setOpenModal(false);
                            setValeSelecionado(null);
                          }}
                        >
                          Não, fechar
                        </Button>
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={darBaixaVale}
                        >
                          Sim, dar baixa
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ValesVencidos;