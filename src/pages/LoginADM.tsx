// src/pages/Login.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function Login() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", senha: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
if (!form.email || !form.senha) {
        toast({ title: "❌ Campos vazios", description: "Por favor, preencha o email e a senha.", variant: "destructive" });
        return;
    }
      
    setLoading(true);

    try {
      // Passo 1: Autenticar com o serviço do Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.senha);
      const user = userCredential.user;

      // Passo 2: Se a autenticação for bem-sucedida, buscar os dados do usuário no Firestore
      const adminsRef = collection(db, "admins");
      const q = query(adminsRef, where("email", "==", user.email)); // Busca pelo email para encontrar o perfil
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Perfil de usuário não encontrado no banco de dados.");
      }

      const usuarioData = querySnapshot.docs[0].data();
      // Passo 3: Verificar o status do usuário no seu sistema
      if (usuarioData.status !== "ativo") {
        await auth.signOut(); // Desloga o usuário se não estiver ativo
        toast({
          title: "⏳ Aguardando aprovação",
          description: "Seu acesso ainda não foi liberado pelo administrador master.",
          variant: "destructive",
        });
      } else {
        // Passo 4: Login bem-sucedido
        // Armazenamos os dados do perfil para uso na aplicação.
        localStorage.setItem("usuario", JSON.stringify({ id: querySnapshot.docs[0].id, ...usuarioData }));
        // Armazena o ID do admin para ser usado em outras páginas, como no cadastro de clientes/transportadoras
        localStorage.setItem("admId", querySnapshot.docs[0].id);

        toast({
          title: "✅ Login realizado",
          description: `Bem-vindo, ${usuarioData.nome || 'usuário'}!`,
        });

        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error(error);
      let description = "Erro ao tentar conectar ao servidor.";
      // O Firebase retorna códigos de erro específicos que podemos usar para dar feedback melhor
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
        description = "Email não encontrado ou inválido.";
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Senha incorreta. Verifique sua senha.";
      }
      
      toast({
        title: "❌ Erro de login",
        description: description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-blue-800 font-bold">
            Login de Colaborador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Email Corporativo</Label>
            <Input
              type="email"
              placeholder="exemplo@heineken.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              type="password"
              placeholder="Digite sua senha"
              value={form.senha}
              onChange={(e) => handleChange("senha", e.target.value)}
            />
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-4"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-center text-sm text-gray-600">
              Ainda não tem uma conta?{" "}
              <a
                href="/"
                className="text-blue-600 hover:underline font-medium"
              >
                Cadastre-se
              </a>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
