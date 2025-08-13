import React, { useEffect, useMemo, useState } from 'react';
import { listCorrecoes, createCorrecao, updateCorrecao, deleteCorrecao, aplicarCorrecoesPreview, Correcao, CorrecaoBase } from '../lib/api';
import { getAllCarteiras } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import PageHeader from '../components/PageHeader';
import { 
  AlertTriangle, 
  CheckCircle, 
  Edit3, 
  Trash2, 
  Plus, 
  Eye, 
  Settings, 
  FileText, 
  RefreshCw,
  Zap,
  Globe,
  Building,
  Loader2,
  XCircle,
  Save,
  Filter
} from 'lucide-react';

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState<CorrecaoBase>({ ...defaultForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [previewInput, setPreviewInput] = useState('');
  const [previewOutput, setPreviewOutput] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('gerenciar');

  const loadCarteiras = async () => {
    try {
      const res = await getAllCarteiras();
      setCarteiras(res);
    } catch (e: any) {
      console.error('Erro ao carregar carteiras:', e);
      setError('Erro ao carregar carteiras');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listCorrecoes({ carteira_id: carteiraId ?? undefined, incluir_globais: incluirGlobais });
      setData(rows);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.detail || e?.message || 'Erro ao carregar correções';
      setError(errorMsg);
      console.error('Erro ao carregar correções:', e);
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
    setFormLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (editingId) {
        await updateCorrecao(editingId, form);
        setSuccessMessage('Regra atualizada!');
      } else {
        await createCorrecao(form);
        setSuccessMessage('Regra criada!');
      }
      
      setForm({ ...defaultForm, carteira_id: carteiraId });
      setEditingId(null);
      await loadData();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.detail || e?.message || 'Erro ao salvar';
      setError(errorMsg);
      console.error('Erro ao salvar correção:', e);
    } finally {
      setFormLoading(false);
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
    setActiveTab('gerenciar');
    setError(null);
    setSuccessMessage(null);
  };

  const onDelete = async (row: Correcao) => {
    if (!confirm(`Excluir regra "${row.padrao}"?`)) return;
    
    try {
      await deleteCorrecao(row.id);
      setSuccessMessage('Regra excluída!');
      await loadData();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.detail || e?.message || 'Erro ao excluir';
      setError(errorMsg);
      console.error('Erro ao excluir correção:', e);
    }
  };

  const onPreview = async () => {
    if (!previewInput.trim()) return;
    
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await aplicarCorrecoesPreview(previewInput, carteiraId ?? null);
      setPreviewOutput(res.corrigido);
    } catch (e: any) {
      setPreviewOutput(null);
      const errorMsg = e?.response?.data?.detail || e?.message || 'Erro no preview';
      setError(errorMsg);
      console.error('Erro ao aplicar preview:', e);
    } finally {
      setPreviewLoading(false);
    }
  };

  const clearForm = () => {
    setForm({ ...defaultForm, carteira_id: carteiraId });
    setEditingId(null);
    setError(null);
    setSuccessMessage(null);
  };

  const stats = useMemo(() => {
    const total = data.length;
    const globais = data.filter(c => c.carteira_id === null).length;
    const especificas = total - globais;
    
    return { total, globais, especificas };
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* PageHeader seguindo o padrão das outras páginas */}
      <PageHeader
        title="Correções de Transcrição"
        subtitle="Gerencie regras para corrigir transcrições automaticamente"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Correções de Transcrição', isActive: true }
        ]}
        actions={
          <div className="flex gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Carregando...' : 'Atualizar'}
            </button>
            <button
              onClick={() => setActiveTab('gerenciar')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              <Plus className="w-4 h-4" />
              Nova Regra
            </button>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total de Regras</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.globais}</div>
              <div className="text-sm text-gray-600">Regras Globais</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.especificas}</div>
              <div className="text-sm text-gray-600">Regras Específicas</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="carteira-filter">Carteira</Label>
                <Select value={carteiraId?.toString() || 'all'} onValueChange={(value) => setCarteiraId(value === 'all' ? null : Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as carteiras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as carteiras</SelectItem>
                    {carteiras.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="incluir-globais"
                  checked={incluirGlobais}
                  onCheckedChange={setIncluirGlobais}
                />
                <Label htmlFor="incluir-globais">Incluir globais</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mensagens de feedback */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Tabs principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gerenciar">Gerenciar</TabsTrigger>
            <TabsTrigger value="preview">Testar</TabsTrigger>
            <TabsTrigger value="visualizar">Visualizar</TabsTrigger>
          </TabsList>

          {/* Tab: Gerenciar Regras */}
          <TabsContent value="gerenciar" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingId ? 'Editar Regra' : 'Nova Regra'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="padrao">Padrão *</Label>
                      <Input
                        id="padrao"
                        value={form.padrao}
                        onChange={(e) => setForm({ ...form, padrao: e.target.value })}
                        placeholder="Texto a ser encontrado"
                        required
                        disabled={formLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="substituicao">Substituição *</Label>
                      <Input
                        id="substituicao"
                        value={form.substituicao}
                        onChange={(e) => setForm({ ...form, substituicao: e.target.value })}
                        placeholder="Texto de substituição"
                        required
                        disabled={formLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="case-sensitive">Case-insensitive</Label>
                      <Select 
                        value={form.ignore_case ? 'true' : 'false'} 
                        onValueChange={(value) => setForm({ ...form, ignore_case: value === 'true' })}
                        disabled={formLoading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="carteira">Carteira</Label>
                      <Select 
                        value={form.carteira_id?.toString() || 'global'} 
                        onValueChange={(value) => setForm({ ...form, carteira_id: value === 'global' ? null : Number(value) })}
                        disabled={formLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Global" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          {carteiras.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ordem">Ordem</Label>
                      <Input
                        id="ordem"
                        type="number"
                        min="0"
                        value={form.ordem}
                        onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
                        placeholder="0"
                        disabled={formLoading}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {formLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {editingId ? 'Salvando...' : 'Criando...'}
                        </>
                      ) : (
                        <>
                          {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          {editingId ? 'Salvar' : 'Criar'}
                        </>
                      )}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={clearForm}
                        disabled={formLoading}
                        className="px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Testar Correções */}
          <TabsContent value="preview" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Testar Correções
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="preview-input">Texto para teste</Label>
                  <textarea
                    id="preview-input"
                    className="w-full h-24 p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cole um trecho de transcrição..."
                    value={previewInput}
                    onChange={(e) => setPreviewInput(e.target.value)}
                    disabled={previewLoading}
                  />
                </div>
                
                <button
                  onClick={onPreview} 
                  disabled={previewLoading || !previewInput.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {previewLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Aplicar Correções
                    </>
                  )}
                </button>
                
                {previewOutput !== null && (
                  <div className="space-y-2">
                    <Label>Resultado</Label>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm text-green-800">{previewOutput}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Visualizar Todas */}
          <TabsContent value="visualizar" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Regras de Correção ({data.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <p className="text-gray-600">Carregando...</p>
                  </div>
                ) : data.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma regra encontrada</h3>
                    <button
                      onClick={() => setActiveTab('gerenciar')}
                      className="inline-flex items-center gap-2 px-2 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 text-sm font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      Criar primeira regra
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.map((row) => (
                      <Card key={row.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <Badge variant={row.carteira_id ? "secondary" : "default"}>
                                  {row.carteira_id ? 'Específica' : 'Global'}
                                </Badge>
                                <Badge variant="outline">Ordem: {row.ordem}</Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Padrão:</Label>
                                  <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                    "{row.padrao}"
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Substituição:</Label>
                                  <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                    "{row.substituicao}"
                                  </div>
                                </div>
                              </div>
                              
                              {row.carteira_id && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Building className="w-4 h-4" />
                                  {carteiras.find(c => c.id === row.carteira_id)?.nome || 'N/A'}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => onEdit(row)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 text-sm font-medium"
                              >
                                <Edit3 className="w-4 h-4" />
                                Editar
                              </button>
                              <button
                                onClick={() => onDelete(row)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200 text-sm font-medium"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Correcoes;

