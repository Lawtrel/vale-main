import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

// Definindo o tipo para um Vale
export interface Vale {
  id?: string;
  cliente: string;
  transportadora: string;
  valorUnitario: number;
  dataVencimento: number;
  data: string;
  status: 'acumulado' | 'processado' | 'vencido';
  organizationId?: string;
  createdAt?: any;
  observacoes: string;
  quantidade: number;
  dataCriacao: number;
}

export function useVales() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Função para criar um novo vale
  const criarVale = async (valeData: Omit<Vale, 'id' | 'status' >) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Usuário não autenticado.");
      }

      await addDoc(collection(db, "valescadastrados"), {
        ...valeData,
        status: 'acumulado',
        organizationId: user.uid, // Associa o vale ao ID do usuário/organização
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Sucesso!",
        description: "Vale criado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao criar vale:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o vale. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar vales
  const buscarVales = async (collectionName: string, status?: Vale['status']) => {
    setLoading(true);
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("Usuário não autenticado.");
        }

        let q = query(collection(db, collectionName));
        if (status) {
            q = query(q, where("status", "==", status));
        }

        const querySnapshot = await getDocs(q);
        const vales = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vale[];
        return vales;
    } catch (error) {
        console.error("Erro ao buscar vales:", error);
        toast({
            title: "Erro",
            description: "Não foi possível carregar os vales.",
            variant: "destructive",
        });
        return [];
    } finally {
        setLoading(false);
    }
  };

  // Função para dar baixa em um vale
    const baixarVale = async (valeId?: string) => {
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split("T")[0];
    if (valeId) {
      // 1️⃣ Processar um vale específico
      const valeRef = doc(db, "valescadastrados", valeId);
      const valeSnap = await getDoc(valeRef);

      if (!valeSnap.exists()) {
        toast({ title: "Erro", description: "Vale não encontrado.", variant: "destructive" });
        return;
      }

      const valeData = valeSnap.data();

      if (valeData.status !== "processado") {
        // Atualiza o status para processado
        await setDoc(doc(db, "valesprocessados", valeId), { ...valeData, status: "processado", dataProcessado: hoje,});
        await deleteDoc(valeRef);
      }

      toast({ title: "Sucesso!", description: `Vale ${valeId} processado com sucesso.` });
    } else {
      // 2️⃣ Processar todos os vales com status processado
      const q = query(collection(db, "valescadastrados"), where("status", "==", "processado"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast({ title: "Info", description: "Não há vales processados para mover." });
        return;
      }

      for (const d of snapshot.docs) {
        const valeData = d.data();
        const id = d.id;

        await setDoc(doc(db, "valesprocessados", id), valeData);
        await deleteDoc(doc(db, "valescadastrados", id));
        console.log(`Vale ${id} movido para valesprocessados`);
      }

      toast({ title: "Sucesso!", description: "Todos os vales processados foram movidos." });
    }
  } catch (error) {
    console.error("Erro ao processar vales:", error);
    toast({ title: "Erro", description: "Falha ao processar os vales.", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};

  return { criarVale, buscarVales, baixarVale, loading };
}