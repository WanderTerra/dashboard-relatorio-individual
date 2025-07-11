import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";

interface Carteira {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

const Carteiras: React.FC = () => {
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editCarteira, setEditCarteira] = useState<Carteira | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", ativo: true });

  const fetchCarteiras = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/carteiras/");
      setCarteiras(res.data);
    } catch (err: any) {
      setError("Erro ao carregar carteiras");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCarteiras();
  }, []);

  const handleOpenModal = (carteira?: Carteira) => {
    if (carteira) {
      setEditCarteira(carteira);
      setForm({
        nome: carteira.nome,
        descricao: carteira.descricao || "",
        ativo: carteira.ativo,
      });
    } else {
      setEditCarteira(null);
      setForm({ nome: "", descricao: "", ativo: true });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditCarteira(null);
    setForm({ nome: "", descricao: "", ativo: true });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      setForm((prev) => ({ ...prev, [name]: e.target.checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editCarteira) {
        await api.put(`/carteiras/${editCarteira.id}`, form);
      } else {
        await api.post("/carteiras/", form);
      }
      fetchCarteiras();
      handleCloseModal();
    } catch (err: any) {
      setError("Erro ao salvar carteira");
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta carteira?")) return;
    setLoading(true);
    try {
      await api.delete(`/carteiras/${id}`);
      fetchCarteiras();
    } catch (err: any) {
      setError("Erro ao excluir carteira");
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Carteiras</h1>
        <Button onClick={() => handleOpenModal()}>Nova Carteira</Button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading && <div>Carregando...</div>}
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="p-2 text-left">Nome</th>
            <th className="p-2 text-left">Descrição</th>
            <th className="p-2 text-left">Ativo</th>
            <th className="p-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {carteiras.map((c) => (
            <tr key={c.id}>
              <td className="p-2">{c.nome}</td>
              <td className="p-2">{c.descricao}</td>
              <td className="p-2">{c.ativo ? "Sim" : "Não"}</td>
              <td className="p-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenModal(c)}>
                  Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>
                  Excluir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de criação/edição */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogTitle>{editCarteira ? "Editar Carteira" : "Nova Carteira"}</DialogTitle>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                name="nome"
                placeholder="Nome"
                value={form.nome}
                onChange={handleChange}
                required
              />
              <Input
                name="descricao"
                placeholder="Descrição"
                value={form.descricao}
                onChange={handleChange}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={form.ativo}
                  onChange={handleChange}
                />
                Ativo
              </label>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Carteiras; 