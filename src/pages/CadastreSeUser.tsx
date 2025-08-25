import { useState } from "react"; 
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom"; // Importando o useNavigate
import { Link } from "react-router-dom"; // Importando o Link para redirecionamento manual

export default function CadastreSeUser() {
  const { toast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL;

  const navigate = useNavigate(); // Inicializando o navigate para redirecionamento

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    tipo: "cliente", // ou "transportadora"
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.email || !form.senha || !form.confirmarSenha) {
      toast({
        title: "❌ Campos obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (form.senha !== form.confirmarSenha) {
      toast({
        title: "❌ Senhas diferentes",
        description: "A confirmação de senha não confere.",
        variant: "destructive",
      });
      return;
    }

    const admId = localStorage.getItem("admId");
    if (!admId) {
      toast({
        title: "❌ Sem administrador associado",
        description: "Você deve estar logado como administrador.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      admResponsavelId: parseInt(admId),
    };

    setLoading(true);

    try {
      const endpoint = form.tipo === "cliente" ? "clientes" : "transportadoras";

      const response = await fetch(`${apiUrl}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "✅ Cadastro realizado",
          description: `${form.tipo} cadastrado com sucesso.`,
        });

        // Limpa o formulário
        setForm({
          nome: "",
          email: "",
          senha: "",
          confirmarSenha: "",
          tipo: "cliente",
        });

        // Redireciona para o login
        navigate("/"); // Caminho para o login
      } else {
        throw new Error("Erro ao cadastrar");
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Erro ao salvar na API.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center text-gray-800">
            Cadastro de Cliente / Transportadora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.tipo}
              onChange={(e) => handleChange("tipo", e.target.value)}
            >
              <option value="cliente">Cliente</option>
              <option value="transportadora">Transportadora</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              type="text"
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="email@empresa.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Senha</Label>
            <Input
              type="password"
              placeholder="Digite a senha"
              value={form.senha}
              onChange={(e) => handleChange("senha", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Confirmar Senha</Label>
            <Input
              type="password"
              placeholder="Confirme a senha"
              value={form.confirmarSenha}
              onChange={(e) => handleChange("confirmarSenha", e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {loading ? "Enviando..." : "Cadastrar"}
          </Button>

          {/* Link para a página de login */}
          <div className="mt-4 text-center">
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Já tem uma conta? Faça login.
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
