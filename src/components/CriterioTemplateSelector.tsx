import React, { useEffect, useMemo, useState } from "react";
import { api, adicionarCriterioNaCarteira } from "../lib/api";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { BookOpen, Plus } from "lucide-react";

interface TemplateCriterion {
  nome: string;
  descricao?: string;
  exemplo_frase?: string;
  categoria?: string;
  peso?: number;
  ativo?: boolean;
}

interface Props {
  carteiraId: number;
  carteiraNome: string;
  onCriterioCreated: (criterio: any) => void;
  onCancel: () => void;
}

const DEFAULT_TEMPLATES: Array<{ id: string; title: string; criteria: TemplateCriterion[] }> = [
  {
    id: "boas_praticas_atendimento",
    title: "Boas Práticas de Atendimento",
    criteria: [
      { nome: "Saudação inicial", descricao: "Cumprimentou cordialmente o cliente", categoria: "Atendimento", peso: 1, ativo: true },
      { nome: "Validação de dados", descricao: "Confirmou dados essenciais do cliente", categoria: "Conformidade", peso: 1, ativo: true },
      { nome: "Clareza na comunicação", descricao: "Comunicou-se de forma clara e objetiva", categoria: "Atendimento", peso: 1, ativo: true },
    ],
  },
  {
    id: "compliance_basico",
    title: "Compliance Básico",
    criteria: [
      { nome: "Aviso de gravação", descricao: "Informou sobre a gravação da ligação", categoria: "Compliance", peso: 1, ativo: true },
      { nome: "Confirmação de consentimento", descricao: "Obteve consentimento do cliente", categoria: "Compliance", peso: 1, ativo: true },
    ],
  },
];

export const CriterioTemplateSelector: React.FC<Props> = ({ carteiraId, carteiraNome, onCriterioCreated, onCancel }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(DEFAULT_TEMPLATES[0]?.id ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allCriterios, setAllCriterios] = useState<any[]>([]);

  useEffect(() => {
    api.get('/criterios/').then(r => setAllCriterios(r.data)).catch(() => setAllCriterios([]));
  }, []);

  const selectedTemplate = useMemo(() => DEFAULT_TEMPLATES.find(t => t.id === selectedTemplateId) ?? null, [selectedTemplateId]);

  const findExisting = (tpl: TemplateCriterion) => {
    const nome = tpl.nome.trim().toLowerCase();
    const categoria = (tpl.categoria || '').trim().toLowerCase();
    return allCriterios.find((c) => {
      const sameName = (c.nome || '').trim().toLowerCase() === nome;
      const sameCat = categoria ? ((c.categoria || '').trim().toLowerCase() === categoria) : true;
      return sameName && sameCat;
    });
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;
    setIsSubmitting(true);

    try {
      for (const c of selectedTemplate.criteria) {
        let criterioUsado: any = findExisting(c);

        if (!criterioUsado) {
          const createRes = await api.post("/criterios/", {
            nome: c.nome,
            descricao: c.descricao ?? "",
            exemplo_frase: c.exemplo_frase ?? "",
            categoria: c.categoria ?? "",
            peso: c.peso ?? 1,
            ativo: c.ativo ?? true,
          });
          criterioUsado = createRes.data;
          setAllCriterios(prev => [...prev, criterioUsado]);
        }

        try {
          await adicionarCriterioNaCarteira({
            carteira_id: carteiraId,
            criterio_id: criterioUsado.id,
            ordem: 1,
            peso_especifico: criterioUsado.peso ?? 1,
          });
          onCriterioCreated({ ...criterioUsado, carteira_id: carteiraId });
        } catch (e) {
          // Se já estiver associado, ignorar e seguir para o próximo
          continue;
        }
      }

      onCancel();
    } catch (error) {
      console.error("Erro ao aplicar template:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Usar Template para {carteiraNome}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTemplateId(t.id)}
              className={`text-left p-4 rounded-lg border transition-colors ${selectedTemplateId === t.id ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
            >
              <div className="font-medium text-gray-900">{t.title}</div>
              <div className="mt-2 text-sm text-gray-600">{t.criteria.length} critérios</div>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="text-sm font-medium text-gray-700 mb-2">Critérios do template</div>
          <div className="space-y-2 max-h-64 overflow-y-auto rounded-md border border-gray-200 p-3 bg-white">
            {selectedTemplate?.criteria.map((c, idx) => (
              <div key={`${c.nome}-${idx}`} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{c.nome}</div>
                  <div className="text-xs text-gray-600">{c.descricao}</div>
                </div>
                <div className="text-xs text-gray-500">Peso: {c.peso ?? 1}</div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleApplyTemplate} disabled={isSubmitting}>
            <Plus className="h-4 w-4" />
            {isSubmitting ? "Aplicando..." : "Aplicar Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 