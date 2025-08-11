import React, { useEffect, useMemo, useState } from "react";
import { api, adicionarCriterioNaCarteira } from "../lib/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Search, Copy, Link2, Target } from "lucide-react";

interface CarteiraRef {
  id: number;
  nome: string;
}

interface Criterio {
  id: number;
  nome: string;
  descricao?: string;
  exemplo_frase?: string;
  categoria?: string;
  peso?: number;
}

interface Props {
  open: boolean;
  carteira: CarteiraRef;
  criterios?: Criterio[]; // opcional, priorizamos busca interna
  onClose: () => void;
  onAdded: (criterio: Criterio & { carteira_id: number }) => void;
}

function normalize(value?: string) {
  return (value || "").trim().toLowerCase();
}

function dedupeByNameCategory(list: Criterio[]): Criterio[] {
  const map = new Map<string, Criterio>();
  for (const c of list) {
    const key = `${normalize(c.nome)}|${normalize(c.categoria)}`;
    if (!map.has(key)) map.set(key, c);
  }
  return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export const AddExistingCriterioModal: React.FC<Props> = ({ open, carteira, criterios, onClose, onAdded }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'associate' | 'copy'>('copy');
  const [query, setQuery] = useState('');

  const [allCriterios, setAllCriterios] = useState<Criterio[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    api.get('/criterios/').then(r => {
      let base: Criterio[] = r.data || [];
      if (criterios && criterios.length) {
        const merged = [...base];
        criterios.forEach(c => {
          if (!merged.some(m => m.id === c.id)) merged.push(c);
        });
        base = merged;
      }
      setAllCriterios(dedupeByNameCategory(base));
    }).catch(() => {
      setAllCriterios(dedupeByNameCategory(criterios || []));
    });
  }, [open]);

  const selected = useMemo(() => allCriterios.find(c => c.id === selectedId) || null, [selectedId, allCriterios]);

  const displayed = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCriterios;
    return allCriterios.filter(c => (
      (c.nome || '').toLowerCase().includes(q) ||
      (c.categoria || '').toLowerCase().includes(q) ||
      (c.descricao || '').toLowerCase().includes(q)
    ));
  }, [query, allCriterios]);

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    exemplo_frase: '',
    categoria: '',
    peso: 1,
  });

  useEffect(() => {
    if (selected) {
      setForm({
        nome: selected.nome,
        descricao: selected.descricao || '',
        exemplo_frase: selected.exemplo_frase || '',
        categoria: selected.categoria || '',
        peso: selected.peso || 1,
      });
    }
  }, [selected]);

  const handleSubmit = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      if (mode === 'associate') {
        await adicionarCriterioNaCarteira({
          carteira_id: carteira.id,
          criterio_id: selected.id,
          ordem: 1,
          peso_especifico: selected.peso || 1,
        });
        onAdded({ ...selected, carteira_id: carteira.id });
      } else {
        // Evitar criar cópia quando já existir critério igual (nome+categoria)
        const existing = allCriterios.find(c => normalize(c.nome) === normalize(form.nome) && normalize(c.categoria) === normalize(form.categoria));
        if (existing) {
          try {
            await adicionarCriterioNaCarteira({
              carteira_id: carteira.id,
              criterio_id: existing.id,
              ordem: 1,
              peso_especifico: existing.peso || 1,
            });
            onAdded({ ...existing, carteira_id: carteira.id });
            onClose();
            return;
          } finally {
            // nothing
          }
        }

        const createRes = await api.post('/criterios/', form);
        const novo = createRes.data as Criterio;
        await adicionarCriterioNaCarteira({
          carteira_id: carteira.id,
          criterio_id: novo.id,
          ordem: 1,
          peso_especifico: novo.peso || 1,
        });
        onAdded({ ...novo, carteira_id: carteira.id });
      }
      onClose();
    } catch (e) {
      console.error('Erro ao adicionar critério existente:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-black">Adicionar critério existente para {carteira.nome}</DialogTitle>
          <p className="text-sm text-black">Reutilize um critério já cadastrado ou crie uma cópia personalizada para esta carteira</p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna esquerda: busca + listagem */}
          <div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Buscar por nome, categoria ou descrição"
                className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="max-h-96 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-sm">
              {displayed.length === 0 ? (
                <div className="py-16 text-center text-black text-sm">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  Nenhum critério encontrado
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {displayed.map((c) => {
                    const isActive = c.id === selectedId;
                    return (
                      <li key={`${normalize(c.nome)}|${normalize(c.categoria)}|${c.id}`}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(c.id)}
                          className={`w-full text-left px-4 py-3 transition-colors ${isActive ? 'bg-blue-50/80' : 'hover:bg-gray-50'} `}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{c.nome}</div>
                              <div className="text-xs text-black line-clamp-1">{c.descricao || 'Sem descrição'}</div>
                              <div className="text-xs text-black mt-1">Categoria: {c.categoria || 'Sem categoria'} • Peso: {c.peso ?? '-'}</div>
                            </div>
                            {isActive && <span className="inline-flex h-6 rounded-full bg-blue-100 px-2 text-[11px] font-medium text-blue-700 items-center">Selecionado</span>}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Coluna direita: modo e formulário quando copiar */}
          <div>
            <div className="text-sm font-medium text-black mb-2">Como deseja adicionar?</div>
            <div className="flex gap-3 text-sm mb-5">
              <button
                type="button"
                onClick={() => setMode('copy')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${mode === 'copy' ? 'border-blue-300 text-blue-700 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <Copy className="h-4 w-4" /> Criar cópia e associar
              </button>
              <button
                type="button"
                onClick={() => setMode('associate')}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${mode === 'associate' ? 'border-purple-300 text-purple-700 bg-purple-50' : 'border-gray-300 hover:bg-gray-50'}`}
              >
                <Link2 className="h-4 w-4" /> Associar original
              </button>
            </div>

            {mode === 'copy' ? (
              selected ? (
                <div className="space-y-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm shadow-sm"
                      value={form.nome}
                      onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      className="w-full min-h-24 border border-gray-200 rounded-xl px-3 py-2 text-sm shadow-sm resize-y"
                      value={form.descricao}
                      onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                      <input
                        className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm shadow-sm"
                        value={form.categoria}
                        onChange={(e) => setForm(prev => ({ ...prev, categoria: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm shadow-sm"
                        value={form.peso}
                        onChange={(e) => setForm(prev => ({ ...prev, peso: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-black">Selecione um critério na lista para copiar e editar</div>
              )
            ) : (
              <div className="text-sm text-gray-600 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
                Será associada a versão original do critério, sem alterações.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full px-6 border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!selected || isSubmitting} className="rounded-full px-6">
            {isSubmitting ? 'Adicionando...' : (mode === 'copy' ? 'Criar cópia e adicionar' : 'Associar critério')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 