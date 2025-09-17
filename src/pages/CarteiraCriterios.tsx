import React, { useEffect, useState } from "react";
import { api, clonarCriterioParaCarteira, atualizarOrdemCriterios } from "../lib/api";
import { Plus, Edit, Trash2, Target, Folder, Link2, ChevronDown, ChevronRight, BookOpen, GripVertical, Minus, Maximize2, ArrowUpDown, Check, X, Bot } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useToast } from "../hooks/use-toast";

interface Carteira {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

interface Criterio {
  id: number;
  nome: string;
  descricao?: string;
  exemplo_frase?: string;
  categoria?: string;
  peso?: number;
}

interface CarteiraCriterio {
  id: number;
  carteira_id: number;
  criterio_id: number;
  ordem?: number;
  peso_especifico?: number;
  criterio?: Criterio;
}

const CarteiraCriterios: React.FC = () => {
  const { toast } = useToast();
  
  // Estados principais
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [associacoes, setAssociacoes] = useState<CarteiraCriterio[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAssociacoes, setLoadingAssociacoes] = useState<number | null>(null);
  const [expandedCarteira, setExpandedCarteira] = useState<number | null>(null);
  const [associacoesCache, setAssociacoesCache] = useState<Map<number, CarteiraCriterio[]>>(new Map());
  
  // Estados para drag & drop e organização das categorias
  const [categoriaOrder, setCategoriaOrder] = useState<string[]>([]);
  const [categoriasMinimizadas, setCategoriasMinimizadas] = useState<Set<string>>(new Set());
  const [draggedCategoria, setDraggedCategoria] = useState<string | null>(null);
  
  // Estados para drag & drop dos critérios
  const [criterioOrder, setCriterioOrder] = useState<Map<string, number[]>>(new Map());
  const [draggedCriterio, setDraggedCriterio] = useState<{ id: number; categoria: string } | null>(null);
  
  // Estado para categorias do banco de dados
  const [categoriasBanco, setCategoriasBanco] = useState<string[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  // Estados dos modais
  const [showCarteiraModal, setShowCarteiraModal] = useState(false);
  const [showCriterioModal, setShowCriterioModal] = useState(false);
  const [editCarteira, setEditCarteira] = useState<Carteira | null>(null);
  const [editCriterio, setEditCriterio] = useState<Criterio | null>(null);
  const [selectedCarteiraForCriterio, setSelectedCarteiraForCriterio] = useState<Carteira | null>(null);
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  // Modal de sucesso ao criar e associar critério
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ criterio: string; carteira: string } | null>(null);
  // Modal de clonagem de critério existente
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTargetCarteira, setCloneTargetCarteira] = useState<Carteira | null>(null);
  const [cloneSearch, setCloneSearch] = useState("");
  const [cloneSelected, setCloneSelected] = useState<Criterio | null>(null);
  const [cloneOverrides, setCloneOverrides] = useState<{
    novo_nome: string;
    nova_descricao: string;
    novo_exemplo_frase: string;
    nova_categoria: string;
    novo_peso?: number;
    peso_especifico?: number;
  }>({ novo_nome: "", nova_descricao: "", novo_exemplo_frase: "", nova_categoria: "", novo_peso: undefined, peso_especifico: undefined });
  const [showCloneSuccessModal, setShowCloneSuccessModal] = useState(false);
  const [cloneSuccessInfo, setCloneSuccessInfo] = useState<{
    fromId: number;
    fromNome: string;
    toCarteiraNome: string;
    novoCriterioId: number;
    ordem: number;
    peso_especifico: number;
    overrides: Partial<{
      novo_nome: string;
      nova_descricao: string;
      novo_exemplo_frase: string;
      nova_categoria: string;
      novo_peso: number;
    }>;
  } | null>(null);

  // Adicionar novos estados para melhorar o drag and drop
  const [dragOverCriterio, setDragOverCriterio] = useState<number | null>(null);
  const [dragOverCategoria, setDragOverCategoria] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ id: number; nome: string; categoria: string } | null>(null);

  // Categorias serão carregadas dinamicamente do banco de dados

  // Estados dos formulários
  const [carteiraForm, setCarteiraForm] = useState({ nome: "", descricao: "", ativo: true });
  const [criterioForm, setCriterioForm] = useState({ nome: "", descricao: "", exemplo_frase: "", categoria: "", categoriaCustom: "", peso: 1 });

  // Funções para drag & drop das categorias
  const handleDragStart = (e: React.DragEvent, categoria: string) => {
    setDraggedCategoria(categoria);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCategoria: string) => {
    e.preventDefault();
    
    if (draggedCategoria && draggedCategoria !== targetCategoria) {
      const newOrder = [...categoriaOrder];
      
      // Se a categoria não está na ordem, adicionar
      if (!newOrder.includes(draggedCategoria)) {
        newOrder.push(draggedCategoria);
      }
      if (!newOrder.includes(targetCategoria)) {
        newOrder.push(targetCategoria);
      }
      
      // Reordenar: mover draggedCategoria para antes de targetCategoria
      const draggedIndex = newOrder.indexOf(draggedCategoria);
      const targetIndex = newOrder.indexOf(targetCategoria);
      
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedCategoria);
      
      setCategoriaOrder(newOrder);
      console.log(`🔄 Categoria "${draggedCategoria}" movida para antes de "${targetCategoria}"`);
    }
    
    setDraggedCategoria(null);
  };

  const toggleCategoriaMinimizada = (categoria: string) => {
    setCategoriasMinimizadas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoria)) {
        newSet.delete(categoria);
      } else {
        newSet.add(categoria);
      }
      return newSet;
    });
  };

  const resetarOrdemCategorias = () => {
    setCategoriaOrder([]);
    setCategoriasMinimizadas(new Set());
    toast({
      title: "🔄 Ordem resetada!",
      description: "Categorias voltaram à ordem padrão.",
    });
  };

  // Funções para drag & drop dos critérios
  const handleCriterioDragStart = (e: React.DragEvent, criterioId: number, categoria: string) => {
    const criterio = criterios.find(c => c.id === criterioId);
    setDraggedCriterio({ id: criterioId, categoria });
    setDragPreview({ id: criterioId, nome: criterio?.nome || '', categoria });
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    
    // Criar uma imagem personalizada para o drag preview
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    dragImage.style.border = '2px solid #3b82f6';
    dragImage.style.borderRadius = '8px';
    dragImage.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleCriterioDragOver = (e: React.DragEvent, criterioId?: number, categoria?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (criterioId) {
      setDragOverCriterio(criterioId);
    }
    if (categoria) {
      setDragOverCategoria(categoria);
    }
  };

  const handleCriterioDragLeave = (e: React.DragEvent) => {
    // Só limpar se realmente saiu do elemento
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverCriterio(null);
      setDragOverCategoria(null);
    }
  };

  const handleCriterioDragEnd = () => {
    setDraggedCriterio(null);
    setDragOverCriterio(null);
    setDragOverCategoria(null);
    setIsDragging(false);
    setDragPreview(null);
  };

  const handleCriterioDrop = async (e: React.DragEvent, targetCriterioId: number, categoria: string) => {
    e.preventDefault();
    setDragOverCriterio(null);
    setDragOverCategoria(null);
    
    if (draggedCriterio && draggedCriterio.id !== targetCriterioId && draggedCriterio.categoria === categoria) {
      const currentOrder = criterioOrder.get(categoria) || [];
      const newOrder = [...currentOrder];
      
      // Se o critério não está na ordem, adicionar
      if (!newOrder.includes(draggedCriterio.id)) {
        newOrder.push(draggedCriterio.id);
      }
      if (!newOrder.includes(targetCriterioId)) {
        newOrder.push(targetCriterioId);
      }
      
      // Reordenar: mover critério arrastado para antes do critério alvo
      const draggedIndex = newOrder.indexOf(draggedCriterio.id);
      const targetIndex = newOrder.indexOf(targetCriterioId);
      
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedCriterio.id);
      
      setCriterioOrder(prev => new Map(prev).set(categoria, newOrder));
      console.log(`🔄 Critério ${draggedCriterio.id} movido para antes de ${targetCriterioId} na categoria ${categoria}`);
      
      // Salvar a nova ordem no backend
      await salvarOrdemCriterios(categoria, newOrder);
    }
    
    setDraggedCriterio(null);
    setIsDragging(false);
    setDragPreview(null);
  };

  const resetarOrdemCriterios = (categoria?: string) => {
    if (categoria) {
      // Resetar ordem de uma categoria específica
      setCriterioOrder(prev => {
        const newMap = new Map(prev);
        newMap.delete(categoria);
        return newMap;
      });
      toast({
        title: "🔄 Ordem resetada!",
        description: `Critérios da categoria "${categoria}" voltaram à ordem padrão.`,
      });
    } else {
      // Resetar ordem de todas as categorias
      setCriterioOrder(new Map());
      toast({
        title: "🔄 Ordem resetada!",
        description: "Todos os critérios voltaram à ordem padrão.",
      });
    }
  };

  // Adicionar função para salvar a ordem no backend
  const salvarOrdemCriterios = async (categoria: string, novaOrdem: number[]) => {
    if (!expandedCarteira) return;
    
    // Obter as associações da carteira atual
    const associacoesDaCarteira = associacoesCache.get(expandedCarteira) || [];
    
    // Filtrar apenas os critérios da categoria atual
    const criteriosDaCategoria = associacoesDaCarteira.filter(assoc => {
      const criterio = criterios.find(c => c.id === assoc.criterio_id);
      return criterio?.categoria === categoria;
    });
    
    // Criar array com a nova ordem
    const criteriosOrdem = novaOrdem.map((criterioId, index) => {
      const associacao = criteriosDaCategoria.find(assoc => assoc.criterio_id === criterioId);
      return {
        id: associacao?.id || 0,
        ordem: index + 1
      };
    }).filter(item => item.id > 0);
    
    if (criteriosOrdem.length > 0) {
      await atualizarOrdemCriterios(expandedCarteira, criteriosOrdem);
      
      // Atualizar o cache local
      const associacoesAtualizadas = associacoesDaCarteira.map(assoc => {
        const novaOrdemItem = criteriosOrdem.find(item => item.id === assoc.id);
        if (novaOrdemItem) {
          return { ...assoc, ordem: novaOrdemItem.ordem };
        }
        return assoc;
      });
      
      setAssociacoesCache(prev => new Map(prev).set(expandedCarteira, associacoesAtualizadas));
      
      toast({
        title: "✅ Ordem salva!",
        description: `A ordem dos critérios da categoria "${categoria}" foi salva com sucesso.`,
      });
    }
  };

  // Função para validar consistência dos dados
  const validarConsistenciaDados = () => {
    const inconsistencias: string[] = [];
    
    // Verificar se todas as associações têm critérios válidos
    associacoes.forEach(assoc => {
      const criterio = criterios.find(c => c.id === assoc.criterio_id);
      if (!criterio) {
        inconsistencias.push(`Associação ${assoc.id} referencia critério inexistente ${assoc.criterio_id}`);
      }
    });
    
    // Verificar se todas as associações têm carteiras válidas
    associacoes.forEach(assoc => {
      const carteira = carteiras.find(c => c.id === assoc.carteira_id);
      if (!carteira) {
        inconsistencias.push(`Associação ${assoc.id} referencia carteira inexistente ${assoc.criterio_id}`);
      }
    });
    
    if (inconsistencias.length > 0) {
      console.warn("⚠️ Inconsistências detectadas:", inconsistencias);
      return false;
    }
    
    console.log("✅ Dados consistentes");
    return true;
  };

  // Função para limpar cache de associações
  const limparCacheAssociacoes = () => {
    setAssociacoesCache(new Map());
    setAssociacoes([]);
  };

  // Função para atualizar todos os dados
  const refreshAllData = async () => {
    setLoading(true);
    try {
      // Limpar cache antes de atualizar
      limparCacheAssociacoes();
      
      await Promise.all([
        fetchCarteiras(),
        fetchCriterios(),
        fetchCategorias()
      ]);
      
      // Se houver uma carteira expandida, atualizar suas associações
      if (expandedCarteira) {
        await fetchAssociacoes(expandedCarteira);
      }
      
      // Validar consistência dos dados
      validarConsistenciaDados();
      
      toast({
        title: "✅ Dados atualizados!",
        description: "Todas as informações foram atualizadas com sucesso.",
      });
    } catch (err) {
      console.error("❌ Erro ao atualizar dados:", err);
      toast({
        title: "❌ Erro ao atualizar",
        description: "Não foi possível atualizar todas as informações.",
      });
    }
    setLoading(false);
  };

  const handleCloseSuccessModal = async () => {
    setShowSuccessModal(false);
    await refreshAllData();
    if (selectedCarteiraForCriterio) {
      setExpandedCarteira(selectedCarteiraForCriterio.id);
      await fetchAssociacoes(selectedCarteiraForCriterio.id);
    } else if (expandedCarteira) {
      await fetchAssociacoes(expandedCarteira);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    refreshAllData();
  }, []);

  // Carregar associações quando uma carteira é expandida
  useEffect(() => {
    if (expandedCarteira) {
      fetchAssociacoes(expandedCarteira);
    }
  }, [expandedCarteira]);

  // Função para buscar categorias únicas do banco de dados
  const fetchCategorias = async () => {
    try {
      setLoadingCategorias(true);
      const res = await api.get("/criterios/categorias");  // ← Removida a barra no final
      
      if (res.data && res.data.categorias && Array.isArray(res.data.categorias)) {
        console.log("✅ Categorias carregadas do banco:", res.data.categorias);
        setCategoriasBanco(res.data.categorias);
      } else {
        console.log("⚠️ Endpoint de categorias não retornou array, usando fallback");
        // Fallback: extrair categorias dos critérios existentes
        const categoriasUnicas = new Set<string>();
        criterios.forEach(criterio => {
          if (criterio.categoria) {
            categoriasUnicas.add(criterio.categoria);
          }
        });
        setCategoriasBanco(Array.from(categoriasUnicas).sort());
      }
    } catch (err) {
      console.error("❌ Erro ao buscar categorias:", err);
      // Fallback: extrair categorias dos critérios existentes
      const categoriasUnicas = new Set<string>();
      criterios.forEach(criterio => {
        if (criterio.categoria) {
          categoriasUnicas.add(criterio.categoria);
        }
      });
      setCategoriasBanco(Array.from(categoriasUnicas).sort());
    } finally {
      setLoadingCategorias(false);
    }
  };

  const fetchCarteiras = async () => {
    try {
      const res = await api.get("/carteiras/");
      // Validar dados recebidos
      if (Array.isArray(res.data)) {
        setCarteiras(res.data);
      } else {
        console.error("❌ Dados de carteiras inválidos:", res.data);
        setCarteiras([]);
      }
    } catch (err) {
      console.error("❌ Erro ao carregar carteiras:", err);
      setCarteiras([]);
    }
  };

  const fetchCriterios = async () => {
    try {
      const res = await api.get("/criterios/");
      // Validar dados recebidos
      if (Array.isArray(res.data)) {
        setCriterios(res.data);
      } else {
        console.error("❌ Dados de critérios inválidos:", res.data);
        setCriterios([]);
      }
    } catch (err) {
      console.error("❌ Erro ao carregar critérios:", err);
      setCriterios([]);
    }
  };

  const fetchAssociacoes = async (carteiraId: number) => {
    setLoadingAssociacoes(carteiraId);
    try {
      console.log(`🔄 Carregando associações para carteira ${carteiraId}...`);
      const res = await api.get(`/carteira_criterios/carteira/${carteiraId}`);
      
      // Validar dados recebidos
      if (Array.isArray(res.data)) {
        console.log(`✅ Associações carregadas:`, res.data);
        console.log(`📊 Total de associações: ${res.data.length}`);
        
        // Atualizar cache e estado global
        setAssociacoesCache(prev => new Map(prev).set(carteiraId, res.data));
        setAssociacoes(res.data);
      } else {
        console.error("❌ Dados de associações inválidos:", res.data);
        setAssociacoesCache(prev => new Map(prev).set(carteiraId, []));
        setAssociacoes([]);
      }
    } catch (err) {
      console.error(`❌ Erro ao carregar associações para carteira ${carteiraId}:`, err);
      // Em caso de erro, limpar associações para evitar dados inconsistentes
      setAssociacoesCache(prev => new Map(prev).set(carteiraId, []));
      setAssociacoes([]);
    } finally {
      setLoadingAssociacoes(null);
    }
  };

  // CRUD Carteira
  const handleCarteiraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editCarteira) {
        await api.put(`/carteiras/${editCarteira.id}`, carteiraForm);
      } else {
        await api.post("/carteiras/", carteiraForm);
      }
      await fetchCarteiras();
      setShowCarteiraModal(false);
      setEditCarteira(null);
      setCarteiraForm({ nome: "", descricao: "", ativo: true });
    } catch (err) {
      console.error("Erro ao salvar carteira:", err);
    }
    setLoading(false);
  };

  const handleCarteiraDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta carteira?")) return;
    setLoading(true);
    try {
      await api.delete(`/carteiras/${id}`);
      await fetchCarteiras();
      
      // Fechar carteira se estiver expandida
      if (expandedCarteira === id) {
        setExpandedCarteira(null);
      }
      
      // Limpar associações da carteira excluída
      setAssociacoes(prev => prev.filter(a => a.carteira_id !== id));
    } catch (err) {
      console.error("Erro ao excluir carteira:", err);
    }
    setLoading(false);
  };

  // CRUD Critério
  const handleCriterioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editCriterio) {
        await api.put(`/criterios/${editCriterio.id}`, criterioForm);
        await fetchCriterios();
        
        // Se estiver editando um critério de uma carteira expandida, atualizar associações
        if (expandedCarteira) {
          await fetchAssociacoes(expandedCarteira);
        }
      } else {
        // Criar critério e associar automaticamente à carteira
        console.log("🔄 Criando critério:", criterioForm);
        // Se estiver em modo "Outra", usar o valor digitado
        const payload = {
          ...criterioForm,
          categoria: criterioForm.categoria === "__outra__" ? (criterioForm.categoriaCustom || "") : criterioForm.categoria
        } as any;
        const criterioResponse = await api.post("/criterios/", payload);
        const novoCriterio = criterioResponse.data;
        console.log("✅ Critério criado:", novoCriterio);
        
        // Atualizar lista de critérios do backend
        await fetchCriterios();
        
        // Associar automaticamente à carteira se houver uma selecionada
        if (selectedCarteiraForCriterio) {
          try {
            const criterioIdLocal = Number((novoCriterio as any)?.id);
            console.log(`🔗 Associando critério ${criterioIdLocal} à carteira ${selectedCarteiraForCriterio.id}...`);
            if (!criterioIdLocal || Number.isNaN(criterioIdLocal) || criterioIdLocal <= 0) {
              console.error('❌ ID do critério inválido após criação:', novoCriterio);
              toast({ title: '❌ Erro ao associar', description: 'ID do critério inválido após criação.' });
              return;
            }
            
            console.log('➡️ POST /carteira_criterios', {
              carteira_id: selectedCarteiraForCriterio.id,
              criterio_id: criterioIdLocal,
              ordem: 1,
              peso_especifico: criterioForm.peso
            });
            const associacaoResponse = await api.post('/carteira_criterios/', {
              carteira_id: selectedCarteiraForCriterio.id,
              criterio_id: criterioIdLocal,
              ordem: 1,
              peso_especifico: criterioForm.peso
            });
            console.log('⬅️ Resposta associação', associacaoResponse.status, associacaoResponse.data);
            
            console.log("✅ Associação criada:", associacaoResponse.data);
            
            // Atualizar associações da carteira
            console.log("🔄 Atualizando associações da carteira...");
            await fetchAssociacoes(selectedCarteiraForCriterio.id);
            
            // Se a carteira estiver expandida, expandir automaticamente
            if (expandedCarteira !== selectedCarteiraForCriterio.id) {
              console.log(`📂 Expandindo carteira ${selectedCarteiraForCriterio.id} automaticamente`);
              setExpandedCarteira(selectedCarteiraForCriterio.id);
            }
            
            setSuccessInfo({ criterio: novoCriterio.nome, carteira: selectedCarteiraForCriterio.nome });
            setShowSuccessModal(true);
          } catch (error) {
            console.error('Erro ao associar critério:', error);
            toast({
              title: "⚠️ Critério criado, mas erro na associação",
              description: "O critério foi criado, mas não foi associado à carteira. Tente associar manualmente.",
            });
          }
        } else {
          setSuccessInfo({ criterio: novoCriterio.nome, carteira: "(sem carteira)" });
          setShowSuccessModal(true);
        }
      }
      
      setShowCriterioModal(false);
      setEditCriterio(null);
      setSelectedCarteiraForCriterio(null);
      setCriterioForm({ nome: "", descricao: "", exemplo_frase: "", categoria: "", categoriaCustom: "", peso: 1 });
      
    } catch (err) {
      console.error("Erro ao salvar critério:", err);
      toast({
        title: "❌ Erro ao criar critério",
        description: "Verifique os dados e tente novamente.",
      });
    }
    setLoading(false);
  };

  const handleCriterioDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este critério?")) return;
    setLoading(true);
    try {
      await api.delete(`/criterios/${id}`);
      await fetchCriterios();
      
      // Atualizar associações se houver uma carteira expandida
      if (expandedCarteira) {
        await fetchAssociacoes(expandedCarteira);
      }
      
      // Limpar associações que referenciam o critério excluído
      setAssociacoes(prev => prev.filter(a => a.criterio_id !== id));
    } catch (err) {
      console.error("Erro ao excluir critério:", err);
    }
    setLoading(false);
  };

  // Associações
  const handleAssociar = async (criterioId: number) => {
    if (!expandedCarteira) return;
    
    try {
      console.log(`🔗 Associando critério ${criterioId} à carteira ${expandedCarteira}...`);
      
      console.log('➡️ POST /carteira_criterios', { carteira_id: expandedCarteira, criterio_id: criterioId });
      await api.post('/carteira_criterios/', {
        carteira_id: expandedCarteira,
        criterio_id: criterioId
      });
      console.log('⬅️ Associação criada com sucesso');
      
      console.log(`✅ Critério associado com sucesso!`);
      
      // Atualizar associações
      await fetchAssociacoes(expandedCarteira);
      
      toast({
        title: "✅ Critério associado!",
        description: "O critério foi adicionado à carteira com sucesso.",
      });
    } catch (err) {
      console.error("❌ Erro ao associar critério:", err);
      toast({
        title: "❌ Erro ao associar",
        description: "Não foi possível associar o critério à carteira.",
      });
    }
  };

  const handleDesassociar = async (associacaoId: number) => {
    try {
      console.log(`🔗 Removendo associação ${associacaoId}...`);
      
      await api.delete(`/carteira_criterios/${associacaoId}`);
      
      console.log(`✅ Associação removida com sucesso!`);
      
      // Atualizar associações se houver uma carteira expandida
      if (expandedCarteira) {
        await fetchAssociacoes(expandedCarteira);
      }
      
      toast({
        title: "✅ Critério removido!",
        description: "O critério foi removido da carteira com sucesso.",
      });
    } catch (err) {
      console.error("❌ Erro ao remover associação:", err);
      toast({
        title: "❌ Erro ao remover",
        description: "Não foi possível remover o critério da carteira.",
      });
    }
  };

  // Funções auxiliares
  const getCriteriosDaCarteira = (carteiraId: number) => {
    // Usar cache se disponível, senão usar estado global
    const associacoesDaCarteira = associacoesCache.get(carteiraId) || associacoes.filter(a => a.carteira_id === carteiraId);
    const criterioIds = associacoesDaCarteira.map(a => a.criterio_id);
    const criteriosFiltrados = criterios.filter(c => criterioIds.includes(c.id));
    
    console.log(`🔍 Carteira ${carteiraId}:`, {
      associacoes: associacoesDaCarteira.length,
      criterioIds,
      criteriosEncontrados: criteriosFiltrados.length,
      criterios: criteriosFiltrados.map(c => ({ id: c.id, nome: c.nome })),
      usandoCache: associacoesCache.has(carteiraId)
    });
    
    return criteriosFiltrados;
  };

  // Aplicar ordem personalizada aos critérios de uma categoria
  const aplicarOrdemCriterios = (criterios: Criterio[], categoria: string) => {
    const ordemPersonalizada = criterioOrder.get(categoria);
    
    if (!ordemPersonalizada || ordemPersonalizada.length === 0) {
      return criterios; // Retornar ordem original se não houver ordem personalizada
    }
    
    // Criar cópia dos critérios para ordenar
    const criteriosOrdenados = [...criterios];
    
    // Aplicar ordem personalizada
    criteriosOrdenados.sort((a, b) => {
      const aIndex = ordemPersonalizada.indexOf(a.id);
      const bIndex = ordemPersonalizada.indexOf(b.id);
      
      // Critérios não na ordem personalizada vão para o final
      if (aIndex === -1 && bIndex === -1) return a.id - b.id;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
    
    return criteriosOrdenados;
  };

  // Obter todas as categorias únicas dos critérios existentes
  const obterCategoriasExistentes = () => {
    // Usar categorias do banco de dados
    if (categoriasBanco.length > 0) {
      return categoriasBanco;
    }
    
    // Fallback: extrair categorias dos critérios existentes (apenas se não houver do banco)
    const categoriasExistentes = new Set<string>();
    criterios.forEach(criterio => {
      if (criterio.categoria) {
        categoriasExistentes.add(criterio.categoria);
      }
    });
    return Array.from(categoriasExistentes).sort();
  };

  // Sugerir categoria baseada no nome do critério usando categorias do banco
  const sugerirCategoria = (nome: string) => {
    const nomeLower = nome.toLowerCase();
    
    // Se não há categorias do banco, não sugerir
    if (categoriasBanco.length === 0) {
      return null;
    }
    
    // Mapeamento de palavras-chave para categorias existentes no banco
    const mapeamentoCategorias: { [key: string]: string[] } = {
      'comunicação': ['comunicação', 'comunicacao', 'voz', 'tom', 'clareza'],
      'produto': ['produto', 'serviço', 'servico', 'item'],
      'atendimento': ['atendimento', 'cliente', 'suporte', 'ajuda'],
      'técnica': ['técnica', 'tecnica', 'tecnologia', 'sistema'],
      'vendas': ['vendas', 'venda', 'comercial', 'negociação'],
      'qualidade': ['qualidade', 'padrão', 'excelência'],
      'eficiência': ['eficiência', 'eficiencia', 'rapidez', 'agilidade'],
      'profissionalismo': ['profissionalismo', 'ética', 'conduta'],
      'resolução': ['resolução', 'resolucao', 'solução', 'solucao'],
      'seguimento': ['seguimento', 'acompanhamento', 'follow-up'],
      'documentação': ['documentação', 'documentacao', 'registro'],
      'confirmação': ['confirmação', 'confirmacao', 'verificação'],
      'empatia': ['empatia', 'compreensão', 'entendimento'],
      'objetividade': ['objetividade', 'foco', 'direto']
    };
    
    // Procurar por palavras-chave e verificar se a categoria existe no banco
    for (const [categoria, palavras] of Object.entries(mapeamentoCategorias)) {
      if (palavras.some(palavra => nomeLower.includes(palavra))) {
        // Verificar se a categoria existe no banco
        if (categoriasBanco.includes(categoria)) {
          return categoria;
        }
      }
    }
    
    return null;
  };

  // Organizar critérios por categoria com ordem personalizada
  const organizarCriteriosPorCategoria = (criterios: Criterio[]) => {
    const categorias = new Map<string, Criterio[]>();
    
    criterios.forEach(criterio => {
      const categoria = criterio.categoria || "Sem Categoria";
      if (!categorias.has(categoria)) {
        categorias.set(categoria, []);
      }
      categorias.get(categoria)!.push(criterio);
    });
    
    // Converter para array e aplicar ordem personalizada
    let categoriasArray = Array.from(categorias.entries())
      .map(([categoria, criterios]) => ({ categoria, criterios }));
    
    // Se não há ordem personalizada definida, usar ordem padrão
    if (categoriaOrder.length === 0) {
      categoriasArray.sort((a, b) => {
        // "Sem Categoria" sempre fica por último
        if (a.categoria === "Sem Categoria") return 1;
        if (b.categoria === "Sem Categoria") return -1;
        
        // Ordenar alfabeticamente
        return a.categoria.localeCompare(b.categoria);
      });
    } else {
      // Aplicar ordem personalizada
      categoriasArray.sort((a, b) => {
        const aIndex = categoriaOrder.indexOf(a.categoria);
        const bIndex = categoriaOrder.indexOf(b.categoria);
        
        // Categorias não na ordem personalizada vão para o final
        if (aIndex === -1 && bIndex === -1) return a.categoria.localeCompare(b.categoria);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });
    }
    
    return categoriasArray;
  };

  const getCriteriosDisponiveis = (carteiraId: number) => {
    const associacoesDaCarteira = associacoes.filter(a => a.carteira_id === carteiraId);
    const criterioIds = associacoesDaCarteira.map(a => a.criterio_id);
    return criterios.filter(c => !criterioIds.includes(c.id));
  };

  const handleToggleCarteira = (carteiraId: number) => {
    if (expandedCarteira === carteiraId) {
      setExpandedCarteira(null);
    } else {
      setExpandedCarteira(carteiraId);
      // Forçar atualização das associações ao expandir
      fetchAssociacoes(carteiraId);
    }
  };

  // Função removida - não é mais necessária com o novo sistema de cache

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Carteiras & Critérios" 
        subtitle="Gerencie carteiras e seus critérios de avaliação"
        actions={
          <div className="flex gap-3">
            <button 
              onClick={refreshAllData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </div>
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
            <button 
              onClick={() => {
                setEditCarteira(null);
                setCarteiraForm({ nome: "", descricao: "", ativo: true });
                setShowCarteiraModal(true);
              }} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              <Plus className="h-4 w-4" />
              Nova Carteira
            </button>
          </div>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Carteiras</p>
                <p className="text-2xl font-bold text-gray-900">{carteiras.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Folder className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Critérios</p>
                <p className="text-2xl font-bold text-gray-900">{criterios.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Associações Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{associacoes.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Link2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          

        </div>

        {/* Lista de Carteiras com Cards Expansíveis */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Carregando carteiras...</span>
            </div>
          ) : carteiras.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
              <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma carteira criada</h3>
              <p className="text-gray-600 mb-6">Crie sua primeira carteira para começar a gerenciar critérios</p>
              <button 
                onClick={() => {
                  setEditCarteira(null);
                  setCarteiraForm({ nome: "", descricao: "", ativo: true });
                  setShowCarteiraModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium"
              >
                <Plus className="h-5 w-5" />
                Criar Primeira Carteira
              </button>
            </div>
          ) : (
            carteiras.map(carteira => (
              <div key={carteira.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header da Carteira */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleToggleCarteira(carteira.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Folder className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{carteira.nome}</h3>
                        <p className="text-sm text-gray-600">{carteira.descricao || "Sem descrição"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        carteira.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {carteira.ativo ? "Ativo" : "Inativo"}
                      </span>
                      {loadingAssociacoes === carteira.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                      ) : expandedCarteira === carteira.id ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expansível - Critérios da Carteira */}
                {expandedCarteira === carteira.id && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold text-gray-900">Critérios da Carteira</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCarteiraForCriterio(carteira);
                              setEditCriterio(null);
                              setCriterioForm({ nome: "", descricao: "", exemplo_frase: "", categoria: "", categoriaCustom: "", peso: 1 });
                              setShowCriterioModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 text-sm font-medium"
                          >
                            <Plus className="h-4 w-4" />
                            Criar Critério
                          </button>
                          <button
                            onClick={() => {
                              setCloneTargetCarteira(carteira);
                              setCloneSearch("");
                              setCloneSelected(null);
                              setCloneOverrides({ novo_nome: "", nova_descricao: "", novo_exemplo_frase: "", nova_categoria: "", novo_peso: undefined, peso_especifico: undefined });
                              setShowCloneModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all duration-200 text-sm font-medium"
                          >
                            <Link2 className="h-4 w-4" />
                            Clonar de existente
                          </button>
                        </div>
                      </div>

                      {/* Lista de Critérios Organizada por Categoria */}
                      {loadingAssociacoes === carteira.id ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                          <span className="ml-3 text-gray-600">Carregando critérios...</span>
                        </div>
                      ) : getCriteriosDaCarteira(carteira.id).length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                          <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <h5 className="text-lg font-medium text-gray-900 mb-2">Nenhum critério associado</h5>
                          <p className="text-gray-600 mb-4">Esta carteira ainda não possui critérios</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedCarteiraForCriterio(carteira);
                                setEditCriterio(null);
                                setCriterioForm({ nome: "", descricao: "", exemplo_frase: "", categoria: "", categoriaCustom: "", peso: 1 });
                                setCriterioForm({ nome: "", descricao: "", exemplo_frase: "", categoria: "", categoriaCustom: "", peso: 1 });
                                setShowCriterioModal(true);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200"
                            >
                              <Plus className="h-4 w-4" />
                              Criar Critério
                            </button>
                            
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {organizarCriteriosPorCategoria(getCriteriosDaCarteira(carteira.id)).map(({ categoria, criterios: criteriosCategoria }) => (
                            <div 
                              key={categoria} 
                              className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-200 ${
                                draggedCategoria === categoria ? 'opacity-50 scale-95' : ''
                              } ${draggedCategoria && draggedCategoria !== categoria ? 'border-dashed border-blue-300' : ''}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, categoria)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, categoria)}
                            >
                              {/* Header da Categoria com Drag & Drop */}
                              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {/* Handle de Drag */}
                                    <div 
                                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                                      title="Arrastar para reordenar"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                    
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <h6 className="font-medium text-gray-900">
                                      {categoria || "Sem Categoria"}
                                    </h6>
                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                      {criteriosCategoria.length} critério{criteriosCategoria.length !== 1 ? 's' : ''}
                                    </span>
                                    {/* Indicador de ordem */}
                                    {categoriaOrder.length > 0 && (
                                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                        #{categoriaOrder.indexOf(categoria) + 1}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Botões de Controle da Categoria */}
                                  <div className="flex items-center gap-2">
                                    {/* Botão para resetar ordem dos critérios */}
                                    {(() => {
                                      const ordem = criterioOrder.get(categoria);
                                      return ordem && ordem.length > 0;
                                    })() && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          resetarOrdemCriterios(categoria);
                                        }}
                                        className="inline-flex items-center p-1.5 text-orange-500 hover:text-orange-700 transition-colors"
                                        title="Resetar ordem dos critérios"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCategoriaMinimizada(categoria);
                                      }}
                                      className="inline-flex items-center p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                                      title={categoriasMinimizadas.has(categoria) ? "Expandir categoria" : "Minimizar categoria"}
                                    >
                                      {categoriasMinimizadas.has(categoria) ? (
                                        <Maximize2 className="w-4 h-4" />
                                      ) : (
                                        <Minus className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Lista de Critérios da Categoria (Minimizável) */}
                              {!categoriasMinimizadas.has(categoria) && (
                                <div className="divide-y divide-gray-100">
                                  {aplicarOrdemCriterios(criteriosCategoria, categoria).map((criterio, index) => (
                                    <div 
                                      key={criterio.id} 
                                      className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-all duration-200 ${
                                        draggedCriterio?.id === criterio.id ? 'opacity-50 scale-95' : ''
                                      } ${draggedCriterio && draggedCriterio.id !== criterio.id && draggedCriterio.categoria === categoria ? 'border-l-4 border-l-blue-300' : ''}`}
                                      draggable
                                      onDragStart={(e) => handleCriterioDragStart(e, criterio.id, categoria)}
                                      onDragOver={handleCriterioDragOver}
                                      onDragLeave={handleCriterioDragLeave}
                                      onDragEnd={handleCriterioDragEnd}
                                      onDrop={(e) => handleCriterioDrop(e, criterio.id, categoria)}
                                    >
                                      <div className="flex items-center gap-3">
                                        {/* Handle de Drag para Critério */}
                                        <div 
                                          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
                                          title="Arrastar para reordenar critério"
                                        >
                                          <GripVertical className="w-4 h-4" />
                                        </div>
                                        
                                        <div className="p-2 bg-green-100 rounded-xl">
                                          <Target className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                          <h5 className="font-medium text-gray-900">{criterio.nome}</h5>
                                          <p className="text-sm text-gray-600">{criterio.descricao || "Sem descrição"}</p>
                                          <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-gray-500">Peso: {criterio.peso}</span>
                                            {criterio.exemplo_frase && (
                                              <span className="text-xs text-gray-500">Ex: {criterio.exemplo_frase}</span>
                                            )}
                                            {/* Indicador de posição do critério */}
                                            {(() => {
                                              const ordem = criterioOrder.get(categoria);
                                              if (ordem && ordem.length > 0) {
                                                const posicao = ordem.indexOf(criterio.id);
                                                return posicao !== -1 ? posicao + 1 : index + 1;
                                              }
                                              return index + 1;
                                            })() > 0 && (
                                              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                                #{(() => {
                                                  const ordem = criterioOrder.get(categoria);
                                                  if (ordem && ordem.length > 0) {
                                                    const posicao = ordem.indexOf(criterio.id);
                                                    return posicao !== -1 ? posicao + 1 : index + 1;
                                                  }
                                                  return index + 1;
                                                })()}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditCriterio(criterio);
                                            setCriterioForm({ 
                                              nome: criterio.nome, 
                                              descricao: criterio.descricao || "", 
                                              exemplo_frase: criterio.exemplo_frase || "", 
                                              categoria: criterio.categoria || "", 
                                              categoriaCustom: "",
                                              peso: criterio.peso || 1
                                            });
                                            setShowCriterioModal(true);
                                          }}
                                          className="inline-flex items-center p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200"
                                        >
                                          <Edit className="h-4 w-4 text-gray-600" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCriterioDelete(criterio.id);
                                          }}
                                          className="inline-flex items-center p-2 border border-red-300 rounded-full hover:bg-red-50 transition-all duration-200"
                                        >
                                          <Trash2 className="h-4 w-4 text-red-600" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ações da Carteira (sempre visíveis) */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditCarteira(carteira);
                        setCarteiraForm({ nome: carteira.nome, descricao: carteira.descricao || "", ativo: carteira.ativo });
                        setShowCarteiraModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-blue-300 text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 transition-all duration-200"
                    >
                      <Edit className="h-4 w-4 text-blue-700" />
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCarteiraDelete(carteira.id);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-full hover:bg-red-50 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Carteira */}
      {showCarteiraModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <Folder className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{editCarteira ? "Editar Carteira" : "Nova Carteira"}</h2>
                    <p className="text-sm text-gray-600">Configure os dados da carteira</p>
                  </div>
                </div>
                
                {/* Botão X para fechar */}
                <button
                  onClick={() => setShowCarteiraModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                  title="Fechar modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCarteiraSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  name="nome"
                  placeholder="Nome da carteira"
                  value={carteiraForm.nome}
                  onChange={e => setCarteiraForm(f => ({ ...f, nome: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <input
                  name="descricao"
                  placeholder="Descrição da carteira"
                  value={carteiraForm.descricao}
                  onChange={e => setCarteiraForm(f => ({ ...f, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  name="ativo" 
                  checked={carteiraForm.ativo} 
                  onChange={e => setCarteiraForm(f => ({ ...f, ativo: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Carteira ativa</span>
              </label>
              
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCarteiraModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Critério */}
      {showCriterioModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-3 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {editCriterio ? "Editar Critério" : "Novo Critério"}
                      {selectedCarteiraForCriterio && !editCriterio && (
                        <span className="block text-sm font-normal text-gray-600">
                          para {selectedCarteiraForCriterio.nome}
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-gray-600">Configure os dados do critério</p>
                    
                    {/* Informação sobre IA */}
                    <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <div className="p-1 bg-blue-100 rounded-md">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-700 font-medium">
                        Todos os campos são utilizados pela IA para avaliar as ligações com precisão
                      </p>
                    </div>
                    
                    {/* Indicador de progresso */}
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(() => {
                                const campos = [criterioForm.nome, criterioForm.descricao, criterioForm.categoria, criterioForm.peso];
                                const preenchidos = campos.filter(campo => campo && String(campo).trim() !== '').length;
                                return (preenchidos / campos.length) * 100;
                              })()}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {(() => {
                            const campos = [criterioForm.nome, criterioForm.descricao, criterioForm.categoria, criterioForm.peso];
                            const preenchidos = campos.filter(campo => campo && String(campo).trim() !== '').length;
                            return `${preenchidos}/${campos.length}`;
                          })()} campos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botão X para fechar */}
                <button
                  onClick={() => setShowCriterioModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                  title="Fechar modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCriterioSubmit} className="px-6 py-3 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  name="nome"
                  placeholder="Nome do critério"
                  value={criterioForm.nome}
                  onChange={e => {
                    const nome = e.target.value.slice(0, 100); // Limitar a 100 caracteres
                    setCriterioForm(f => ({ ...f, nome }));
                    
                    // Sugerir categoria automaticamente se não houver uma selecionada
                    if (!criterioForm.categoria && nome.length > 3) {
                      const categoriaSugerida = sugerirCategoria(nome);
                      if (categoriaSugerida) {
                        setCriterioForm(f => ({ ...f, categoria: categoriaSugerida }));
                      }
                    }
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                
                {/* Mostrar categoria sugerida */}
                {criterioForm.nome.length > 3 && !criterioForm.categoria && categoriasBanco.length > 0 && (
                  <div className="mt-1 text-xs text-blue-600">
                    💡 Dica: Digite mais para receber sugestão de categoria do banco
                  </div>
                )}
                
                {/* Mostrar quando categoria foi sugerida automaticamente */}
                {criterioForm.nome.length > 3 && criterioForm.categoria && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-green-600">
                    <span>✅ Categoria "{criterioForm.categoria}" sugerida automaticamente</span>
                    <button
                      type="button"
                      onClick={() => setCriterioForm(f => ({ ...f, categoria: "" }))}
                      className="text-red-500 hover:text-red-700 underline"
                    >
                      Limpar
                    </button>
                  </div>
                )}
                
                {/* Mostrar quando não há categorias no banco */}
                {criterioForm.nome.length > 3 && !criterioForm.categoria && categoriasBanco.length === 0 && (
                  <div className="mt-1 text-xs text-orange-600">
                    ⚠️ Nenhuma categoria encontrada no banco. Crie uma nova categoria.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  placeholder="Descreva detalhadamente o critério de avaliação..."
                  value={criterioForm.descricao}
                  onChange={e => setCriterioForm(f => ({ ...f, descricao: e.target.value.slice(0, 500) }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {criterioForm.descricao.length}/500 caracteres
                  </span>
                  {criterioForm.descricao.length > 400 && (
                    <span className="text-xs text-orange-600">
                      ⚠️ Descrição muito longa
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Exemplo de frase
                </label>
                <textarea
                  name="exemplo_frase"
                  placeholder="Exemplo de como o critério deve ser aplicado na prática..."
                  value={criterioForm.exemplo_frase}
                  onChange={e => setCriterioForm(f => ({ ...f, exemplo_frase: e.target.value.slice(0, 200) }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">
                    {criterioForm.exemplo_frase.length}/200 caracteres
                  </span>
                  {criterioForm.exemplo_frase.length > 150 && (
                    <span className="text-xs text-orange-500">
                      ⚠️ Exemplo muito longo
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Categoria
                </label>
                <select
                  name="categoria"
                  value={criterioForm.categoria}
                  onChange={e => setCriterioForm(f => ({ ...f, categoria: e.target.value }))}
                  disabled={loadingCategorias}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingCategorias ? "Carregando categorias..." : "Selecione uma categoria"}
                  </option>
                  
                  {/* Categorias do banco de dados */}
                  {obterCategoriasExistentes().length > 0 && (
                    <optgroup label="Categorias Disponíveis">
                      {obterCategoriasExistentes().map(categoria => (
                        <option key={categoria} value={categoria}>
                          {categoria} 📊
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* Outra categoria */}
                  <optgroup label="Nova Categoria">
                    <option value="__outra__">➕ Outra (especificar)</option>
                  </optgroup>
                </select>
                
                {/* Campo para categoria personalizada */}
                {criterioForm.categoria === "__outra__" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Digite o nome da nova categoria"
                      value={criterioForm.categoriaCustom}
                      onChange={e => setCriterioForm(f => ({ ...f, categoriaCustom: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Esta categoria será salva automaticamente quando o critério for criado
                    </p>
                  </div>
                )}
                
                {/* Status de carregamento */}
                {loadingCategorias && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
                    Carregando categorias do banco de dados...
                  </div>
                )}
                
                {/* Informações sobre as categorias */}
                {!loadingCategorias && categoriasBanco.length > 0 && (
                  <div className="mt-1 text-xs text-green-600">
                    ✅ {categoriasBanco.length} categorias disponíveis no banco
                  </div>
                )}
                
                {/* Mostrar quando não há categorias */}
                {!loadingCategorias && categoriasBanco.length === 0 && (
                  <div className="mt-1 text-xs text-orange-600">
                    ⚠️ Nenhuma categoria encontrada. Crie critérios para gerar categorias automaticamente.
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Peso
                  <span className="text-xs text-gray-500 ml-2">(Importância do critério)</span>
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <input
                      name="peso"
                      type="number"
                      min={0.1}
                      max={10}
                      step={0.1}
                      placeholder="1.0"
                      value={criterioForm.peso}
                      onChange={e => setCriterioForm(f => ({ ...f, peso: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600">Peso padrão:</span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(peso => (
                        <button
                          key={peso}
                          type="button"
                          onClick={() => setCriterioForm(f => ({ ...f, peso }))}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-all font-medium ${
                            criterioForm.peso === peso
                              ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {peso}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
                
                {/* Preview do Critério */}
                {(criterioForm.nome || criterioForm.descricao || criterioForm.exemplo_frase) && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Preview do Critério</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        {criterioForm.nome && (
                          <div>
                            <span className="text-xs font-medium text-gray-600">Nome:</span>
                            <p className="text-sm text-gray-900 font-medium">{criterioForm.nome}</p>
                          </div>
                        )}
                        {criterioForm.descricao && (
                          <div>
                            <span className="text-xs font-medium text-gray-600">Descrição:</span>
                            <p className="text-sm text-gray-900">{criterioForm.descricao}</p>
                          </div>
                        )}
                        {criterioForm.exemplo_frase && (
                          <div>
                            <span className="text-xs font-medium text-gray-600">Exemplo:</span>
                            <p className="text-sm text-gray-900 italic">"{criterioForm.exemplo_frase}"</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-gray-600">Categoria:</span>
                          <span className="text-sm text-gray-900 ml-2">
                            {criterioForm.categoria || "Não definida"}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600">Peso:</span>
                          <span className="text-sm text-gray-900 ml-2">
                            {criterioForm.peso} {criterioForm.peso >= 5 ? "🔥" : criterioForm.peso >= 3 ? "⚡" : "📝"}
                          </span>
                        </div>
                        <div className="pt-2">
                          <span className="text-xs font-medium text-gray-600">Nível de Importância:</span>
                          <div className="mt-1">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              criterioForm.peso <= 2 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : criterioForm.peso <= 4 
                                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' 
                                  : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              {criterioForm.peso <= 2 ? 'Baixo' : 
                               criterioForm.peso <= 4 ? 'Médio' : 'Alto'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                                <div className="flex gap-3 justify-end pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCriterioModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !criterioForm.nome.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Salvando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        {editCriterio ? "Atualizar Critério" : "Criar Critério"}
                      </div>
                    )}
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Critério Existente */}
      {showCloneModal && cloneTargetCarteira && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <h3 className="text-lg font-bold">Clonar critério para {cloneTargetCarteira.nome}</h3>
              <p className="text-xs opacity-90">Será criado um novo critério independente e associado a esta carteira.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buscar critério existente</label>
                  <input
                    value={cloneSearch}
                    onChange={e => setCloneSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Digite parte do nome ou categoria"
                  />
                  <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded">
                    {criterios
                      .filter(c => {
                        const q = cloneSearch.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          c.nome.toLowerCase().includes(q) ||
                          (c.categoria || "").toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 50)
                      .map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setCloneSelected(c);
                            setCloneOverrides({
                              novo_nome: c.nome || "",
                              nova_descricao: c.descricao || "",
                              novo_exemplo_frase: c.exemplo_frase || "",
                              nova_categoria: c.categoria || "",
                              novo_peso: c.peso,
                              peso_especifico: c.peso,
                            });
                          }}
                          className={`w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-gray-50 ${cloneSelected?.id === c.id ? 'bg-purple-50' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{c.nome}</div>
                              <div className="text-xs text-gray-600">Categoria: {c.categoria || '—'} • Peso: {c.peso ?? '—'}</div>
                            </div>
                            <div className="text-xs text-gray-500">ID {c.id}</div>
                          </div>
                        </button>
                      ))}
                    {criterios.length === 0 && (
                      <div className="p-3 text-sm text-gray-600">Nenhum critério encontrado.</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overrides (opcionais)</label>
                  <div className="space-y-3">
                    <input
                      placeholder="Novo nome"
                      value={cloneOverrides.novo_nome}
                      onChange={e => setCloneOverrides(o => ({ ...o, novo_nome: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                    <textarea
                      placeholder="Nova descrição"
                      value={cloneOverrides.nova_descricao}
                      onChange={e => setCloneOverrides(o => ({ ...o, nova_descricao: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded min-h-[72px]"
                    />
                    <textarea
                      placeholder="Novo exemplo de frase"
                      value={cloneOverrides.novo_exemplo_frase}
                      onChange={e => setCloneOverrides(o => ({ ...o, novo_exemplo_frase: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded min-h-[48px]"
                    />
                    <input
                      placeholder="Nova categoria"
                      value={cloneOverrides.nova_categoria}
                      onChange={e => setCloneOverrides(o => ({ ...o, nova_categoria: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Novo peso (critério)</label>
                        <input
                          type="number"
                          step={0.1}
                          value={cloneOverrides.novo_peso ?? ''}
                          onChange={e => setCloneOverrides(o => ({ ...o, novo_peso: e.target.value ? Number(e.target.value) : undefined }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Peso específico (associação)</label>
                        <input
                          type="number"
                          step={0.1}
                          value={cloneOverrides.peso_especifico ?? ''}
                          onChange={e => setCloneOverrides(o => ({ ...o, peso_especifico: e.target.value ? Number(e.target.value) : undefined }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCloneModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!cloneSelected || !cloneTargetCarteira) return;
                  try {
                    const payload: any = {
                      from_criterio_id: cloneSelected.id,
                      to_carteira_id: cloneTargetCarteira.id,
                    };
                    if (cloneOverrides.novo_nome) payload.novo_nome = cloneOverrides.novo_nome;
                    if (cloneOverrides.nova_descricao) payload.nova_descricao = cloneOverrides.nova_descricao;
                    if (cloneOverrides.novo_exemplo_frase) payload.novo_exemplo_frase = cloneOverrides.novo_exemplo_frase;
                    if (cloneOverrides.nova_categoria) payload.nova_categoria = cloneOverrides.nova_categoria;
                    if (typeof cloneOverrides.novo_peso === 'number') payload.novo_peso = cloneOverrides.novo_peso;
                    if (typeof cloneOverrides.peso_especifico === 'number') payload.peso_especifico = cloneOverrides.peso_especifico;

                    console.log('➡️ POST /carteira_criterios/clone', payload);
                    const resp = await clonarCriterioParaCarteira(payload);

                    setShowCloneModal(false);

                    setCloneSuccessInfo({
                      fromId: cloneSelected.id,
                      fromNome: cloneSelected.nome,
                      toCarteiraNome: cloneTargetCarteira.nome,
                      novoCriterioId: Number((resp?.novo_criterio_id) ?? 0),
                      ordem: Number((resp?.ordem) ?? 1),
                      peso_especifico: Number((resp?.peso_especifico) ?? (cloneOverrides.peso_especifico ?? cloneOverrides.novo_peso ?? cloneSelected.peso ?? 1)),
                      overrides: {
                        novo_nome: cloneOverrides.novo_nome || undefined,
                        nova_descricao: cloneOverrides.nova_descricao || undefined,
                        novo_exemplo_frase: cloneOverrides.novo_exemplo_frase || undefined,
                        nova_categoria: cloneOverrides.nova_categoria || undefined,
                        novo_peso: typeof cloneOverrides.novo_peso === 'number' ? cloneOverrides.novo_peso : undefined,
                      },
                    });
                    setShowCloneSuccessModal(true);
                  } catch (err) {
                    console.error('❌ Erro ao clonar critério:', err);
                    toast({ title: '❌ Erro ao clonar', description: 'Não foi possível clonar o critério.' });
                  }
                }}
                disabled={!cloneSelected}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-full hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clonar e associar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloneSuccessModal && cloneSuccessInfo && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <h3 className="text-lg font-bold">Critério clonado e associado</h3>
            </div>
            <div className="p-6 space-y-3 text-sm text-gray-800">
              <div><span className="font-semibold">Origem:</span> ID {cloneSuccessInfo.fromId} • {cloneSuccessInfo.fromNome}</div>
              <div><span className="font-semibold">Destino (carteira):</span> {cloneSuccessInfo.toCarteiraNome}</div>
              <div><span className="font-semibold">Novo critério ID:</span> {cloneSuccessInfo.novoCriterioId}</div>
              <div><span className="font-semibold">Ordem:</span> {cloneSuccessInfo.ordem}</div>
              <div><span className="font-semibold">Peso específico (associação):</span> {cloneSuccessInfo.peso_especifico}</div>
              {Object.values(cloneSuccessInfo.overrides).some(v => v !== undefined && v !== "") && (
                <div className="mt-2">
                  <div className="font-semibold mb-1">Overrides aplicados:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {cloneSuccessInfo.overrides.novo_nome && (<li><span className="font-medium">Nome:</span> {cloneSuccessInfo.overrides.novo_nome}</li>)}
                    {cloneSuccessInfo.overrides.nova_descricao && (<li><span className="font-medium">Descrição:</span> {cloneSuccessInfo.overrides.nova_descricao}</li>)}
                    {cloneSuccessInfo.overrides.novo_exemplo_frase && (<li><span className="font-medium">Exemplo:</span> {cloneSuccessInfo.overrides.novo_exemplo_frase}</li>)}
                    {cloneSuccessInfo.overrides.nova_categoria && (<li><span className="font-medium">Categoria:</span> {cloneSuccessInfo.overrides.nova_categoria}</li>)}
                    {typeof cloneSuccessInfo.overrides.novo_peso === 'number' && (<li><span className="font-medium">Peso (critério):</span> {cloneSuccessInfo.overrides.novo_peso}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={async () => {
                  setShowCloneSuccessModal(false);
                  // Atualizar dados após confirmação
                  await fetchCriterios();
                  if (cloneTargetCarteira) {
                    await fetchAssociacoes(cloneTargetCarteira.id);
                    setExpandedCarteira(cloneTargetCarteira.id);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Ok, atualizar
              </button>
            </div>
          </div>
        </div>
      )}
      {showSuccessModal && successInfo && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <h3 className="text-lg font-bold">Critério criado</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-gray-800">
                O critério <span className="font-semibold">{successInfo.criterio}</span> foi criado e associado à carteira
                <span className="font-semibold"> {successInfo.carteira}</span>.
              </p>
              <p className="text-gray-600 text-sm">Ao fechar este aviso, atualizaremos a página para exibir o novo critério.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleCloseSuccessModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Ok, atualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarteiraCriterios;