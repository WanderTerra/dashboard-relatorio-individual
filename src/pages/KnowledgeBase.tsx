import React, { useState, useEffect } from 'react';
import { Plus, FileText, Target, Users, Brain, Search, Edit, Trash2, Upload, Folder } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';

interface KnowledgeDocument {
  id: number;
  title: string;
  content: string;
  category: string;
  assistant_types: string[];
  tags: string[];
  priority: number;
  uploader_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState<string>('all');
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    assistant_types: [] as string[],
    priority: 3,
    tags: [] as string[]
  });

  useEffect(() => {
    loadAssistants();
    loadDocuments();
  }, []);

  const loadAssistants = async () => {
    try {
      const response = await fetch('/api/ai/admin/assistants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssistants(data.assistants);
      }
    } catch (error) {
      console.error('Erro ao carregar assistentes:', error);
    }
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      // TODO: Implementar endpoint para buscar documentos
      // Por enquanto, dados mockados
      setDocuments([
        {
          id: 1,
          title: 'Manual de Atendimento',
          content: 'Este é o manual básico de atendimento ao cliente...',
          category: 'attendance',
          assistant_types: ['attendance'],
          tags: ['manual', 'atendimento', 'procedimentos'],
          priority: 5,
          uploader_id: 1,
          is_active: true,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          title: 'Política de RH',
          content: 'Políticas gerais de recursos humanos da empresa...',
          category: 'hr',
          assistant_types: ['hr'],
          tags: ['política', 'rh', 'benefícios'],
          priority: 5,
          uploader_id: 1,
          is_active: true,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/ai/admin/knowledge/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          title: '',
          content: '',
          category: '',
          assistant_types: [],
          priority: 3,
          tags: []
        });
        loadDocuments();
      }
    } catch (error) {
      console.error('Erro ao adicionar documento:', error);
    }
  };

  const toggleAssistantType = (assistantId: string) => {
    setFormData(prev => ({
      ...prev,
      assistant_types: prev.assistant_types.includes(assistantId)
        ? prev.assistant_types.filter(id => id !== assistantId)
        : [...prev.assistant_types, assistantId]
    }));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getAssistantIcon = (assistantId: string) => {
    switch (assistantId) {
      case 'attendance':
        return <Target size={16} className="text-blue-500" />;
      case 'hr':
        return <Users size={16} className="text-green-500" />;
      case 'psychological':
        return <Brain size={16} className="text-purple-500" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5: return 'text-red-600 bg-red-100';
      case 4: return 'text-orange-600 bg-orange-100';
      case 3: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-green-600 bg-green-100';
      case 1: return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssistant = selectedAssistant === 'all' || 
                            doc.assistant_types.includes(selectedAssistant);
    return matchesSearch && matchesAssistant;
  });

  return (
    <div>
      <PageHeader
        title="Base de Conhecimento"
        subtitle="Gerencie documentos para os assistentes de IA"
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus size={16} />
            Adicionar Documento
          </button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 mb-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            <select
              value={selectedAssistant}
              onChange={(e) => setSelectedAssistant(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            >
              <option value="all">Todos os assistentes</option>
              {assistants.map(assistant => (
                <option key={assistant.id} value={assistant.id}>
                  {assistant.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-gray-600" />
                    <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getPriorityColor(doc.priority)}`}>
                    Prioridade {doc.priority}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{doc.content}</p>
                
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-700">Assistentes:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {doc.assistant_types.map(type => (
                      <span key={type} className="flex items-center gap-1 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs shadow-sm">
                        {getAssistantIcon(type)}
                        {assistants.find(a => a.id === type)?.name || type}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Criado em {new Date(doc.created_at).toLocaleDateString()}</span>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-sm">
                      <Edit size={14} className="text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-red-50 border border-red-200 rounded-lg transition-all duration-200 hover:shadow-sm text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredDocuments.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedAssistant !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece adicionando seu primeiro documento.'}
            </p>
            {(!searchTerm && selectedAssistant === 'all') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md mx-auto"
              >
                <Plus size={16} />
                Adicionar Documento
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-xl font-bold mb-4">Adicionar Documento</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conteúdo
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 resize-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="attendance">Atendimento</option>
                  <option value="hr">RH</option>
                  <option value="psychological">Psicológico</option>
                  <option value="general">Geral</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assistentes que podem usar este documento
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {assistants.map(assistant => (
                    <label key={assistant.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:shadow-sm">
                      <input
                        type="checkbox"
                        checked={formData.assistant_types.includes(assistant.id)}
                        onChange={() => toggleAssistantType(assistant.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getAssistantIcon(assistant.id)}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{assistant.name}</div>
                          <div className="text-xs text-gray-600">{assistant.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value={5}>🔴 Crítica (Manual essencial)</option>
                  <option value={4}>🟠 Alta (Políticas importantes)</option>
                  <option value={3}>🟡 Média (Scripts e procedimentos)</option>
                  <option value={2}>🟢 Baixa (Informações gerais)</option>
                  <option value={1}>⚪ Mínima (Referência)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm shadow-sm">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Digite uma tag e pressione Enter"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                >
                  Adicionar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
