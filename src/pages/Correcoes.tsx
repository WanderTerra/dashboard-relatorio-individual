import React, { useEffect, useMemo, useState } from 'react';
import { listCorrecoes, createCorrecao, updateCorrecao, deleteCorrecao, aplicarCorrecoesPreview, Correcao, CorrecaoBase } from '../lib/api';
import { getAllCarteiras } from '../lib/api';

type Carteira = { id: number; nome: string };

const defaultForm: CorrecaoBase = {
  padrao: '',
  substituicao: '',
  ignore_case: true,
  carteira_id: null,
  ordem: 0,
};

const Correcoes: React.FC = () => {
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [carteiraId, setCarteiraId] = useState<number | null>(null);
  const [incluirGlobais, setIncluirGlobais] = useState(true);

  const [data, setData] = useState<Correcao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CorrecaoBase>({ ...defaultForm });
  const [editingId, setEditingId] = useState<number | null>(null);

  const [previewInput, setPreviewInput] = useState('');
  const [previewOutput, setPreviewOutput] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadCarteiras = async () => {
    try {
      const res = await getAllCarteiras();
      setCarteiras(res);
    } catch (e: any) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listCorrecoes({ carteira_id: carteiraId ?? undefined, incluir_globais: incluirGlobais });
      setData(rows);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar correções');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCarteiras();
  }, []);

  useEffect(() => {
    loadData();
  }, [carteiraId, incluirGlobais]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCorrecao(editingId, form);
      } else {
        await createCorrecao(form);
      }
      setForm({ ...defaultForm, carteira_id: carteiraId });
      setEditingId(null);
      await loadData();
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || 'Erro ao salvar');
    }
  };

  const onEdit = (row: Correcao) => {
    setEditingId(row.id);
    setForm({
      padrao: row.padrao,
      substituicao: row.substituicao,
      ignore_case: row.ignore_case,
      carteira_id: row.carteira_id ?? null,
      ordem: row.ordem,
    });
  };

  const onDelete = async (row: Correcao) => {
    if (!confirm('Excluir esta correção?')) return;
    try {
      await deleteCorrecao(row.id);
      await loadData();
    } catch (e: any) {
      alert(e?.response?.data?.detail || e?.message || 'Erro ao excluir');
    }
  };

  const onPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await aplicarCorrecoesPreview(previewInput, carteiraId ?? null);
      setPreviewOutput(res.corrigido);
    } catch (e: any) {
      setPreviewOutput(null);
      alert(e?.response?.data?.detail || e?.message || 'Erro ao aplicar preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Correções de Transcrição</h1>

      {/* Filtros */}
      <div className="flex gap-4 items-end mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Carteira</label>
          <select
            className="border rounded px-3 py-2 min-w-[220px]"
            value={carteiraId ?? ''}
            onChange={(e) => setCarteiraId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Globais (todas as carteiras)</option>
            {carteiras.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={incluirGlobais} onChange={(e) => setIncluirGlobais(e.target.checked)} />
          <span>Incluir regras globais</span>
        </label>
        <button
          onClick={loadData}
          className="px-3 py-2 rounded bg-blue-600 text-white"
          disabled={loading}
        >
          Recarregar
        </button>
      </div>

      {/* Formulário de criação/edição */}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded mb-6">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Padrão</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={form.padrao}
            onChange={(e) => setForm({ ...form, padrao: e.target.value })}
            placeholder="texto a ser encontrado"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Substituição</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={form.substituicao}
            onChange={(e) => setForm({ ...form, substituicao: e.target.value })}
            required
          />
        </div>
        {/* Campo 'Tipo' removido: apenas substituição literal */}
        <div>
          <label className="block text-sm font-medium mb-1">Case insensitive</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={form.ignore_case ? '1' : '0'}
            onChange={(e) => setForm({ ...form, ignore_case: e.target.value === '1' })}
          >
            <option value="1">Sim</option>
            <option value="0">Não</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Carteira desta regra</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={form.carteira_id ?? ''}
            onChange={(e) => setForm({ ...form, carteira_id: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Global</option>
            {carteiras.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        {/* Campo 'Ativo' removido */}
        <div>
          <label className="block text-sm font-medium mb-1">Ordem</label>
          <input
            type="number"
            className="border rounded px-3 py-2 w-full"
            value={form.ordem}
            onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
          />
        </div>
        {/* Campo 'Descrição' removido */}
        <div className="flex gap-2 col-span-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded" type="submit">
            {editingId ? 'Salvar' : 'Adicionar'}
          </button>
          {editingId && (
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={() => { setEditingId(null); setForm({ ...defaultForm, carteira_id: carteiraId }); }}
            >Cancelar</button>
          )}
        </div>
      </form>

      {/* Preview */}
      <div className="p-4 border rounded mb-6">
        <h2 className="font-semibold mb-2">Preview</h2>
        <textarea
          className="border rounded px-3 py-2 w-full h-24"
          placeholder="Cole um trecho para testar as correções"
          value={previewInput}
          onChange={(e) => setPreviewInput(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={onPreview} disabled={previewLoading}>
            Aplicar correções
          </button>
        </div>
        {previewOutput !== null && (
          <div className="mt-3">
            <div className="text-sm text-gray-600 mb-1">Resultado</div>
            <pre className="bg-gray-50 p-3 rounded whitespace-pre-wrap">{previewOutput}</pre>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Ordem</th>
              <th className="text-left p-2">Padrão</th>
              {/* Tipo removido */}
              <th className="text-left p-2">Case</th>
              <th className="text-left p-2">Substituição</th>
              <th className="text-left p-2">Carteira</th>
              <th className="text-left p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="p-3" colSpan={8}>Carregando…</td></tr>
            )}
            {!loading && data.length === 0 && (
              <tr><td className="p-3" colSpan={8}>Sem registros</td></tr>
            )}
            {data.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.ordem}</td>
                <td className="p-2 max-w-[420px] truncate" title={row.padrao}>{row.padrao}</td>
                {/* Tipo removido */}
                <td className="p-2">{row.ignore_case ? 'insensitive' : 'sensitive'}</td>
                <td className="p-2 max-w-[320px] truncate" title={row.substituicao}>{row.substituicao}</td>
                <td className="p-2">{row.carteira_id ?? 'Global'}</td>
                <td className="p-2 flex gap-2">
                  <button className="px-2 py-1 text-blue-700" onClick={() => onEdit(row)}>Editar</button>
                  <button className="px-2 py-1 text-red-700" onClick={() => onDelete(row)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Correcoes;

