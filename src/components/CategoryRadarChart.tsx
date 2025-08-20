import React, { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer as BarResponsiveContainer } from 'recharts';
import { BarChart3, Radar as RadarIcon, Database } from 'lucide-react';
import { getCriteriosCategorias } from '../lib/api';

interface CategoryCriteria {
  category: string;
  criteria: Array<{
    name: string;
    value: number;
    fullMark: number;
  }>;
  averageScore: number;
  totalCriteria: number;
}

interface CategoryRadarChartProps {
  data: any[];
  isLoading?: boolean;
  error?: string;
}

export const CategoryRadarChart: React.FC<CategoryRadarChartProps> = ({
  data,
  isLoading = false,
  error
}) => {
  const [activeChart, setActiveChart] = useState<'radar' | 'bar'>('radar');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Busca categorias da API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const categoriesData = await getCriteriosCategorias();
        console.log('✅ Categorias carregadas:', categoriesData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('❌ Erro ao buscar categorias:', err);
        // Fallback: extrair categorias dos dados existentes
        if (data && data.length > 0) {
          const uniqueCategories = new Set<string>();
          data.forEach(item => {
            if (item.categoria) {
              uniqueCategories.add(item.categoria);
            }
          });
          setCategories(Array.from(uniqueCategories).sort());
        }
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [data]);

  if (isLoading || loadingCategories) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Processando dados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <Database className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 font-medium">Erro ao carregar dados</span>
        </div>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        Nenhum dado disponível para exibição
      </div>
    );
  }

  // Agrupa critérios por categoria
  const groupByCategory = (): CategoryCriteria[] => {
    const categoryMap = new Map<string, CategoryCriteria>();
    
    // Inicializa categorias
    categories.forEach(category => {
      categoryMap.set(category, {
        category,
        criteria: [],
        averageScore: 0,
        totalCriteria: 0
      });
    });

    // Agrupa critérios
    data.forEach(item => {
      // Tenta usar a categoria do item primeiro, depois o subject
      const itemCategory = item.categoria || item.subject;
      let category = itemCategory;
      
      // Se não há categoria específica, tenta mapear pelo nome
      if (!category || !categories.includes(category)) {
        // Mapeamento inteligente baseado no nome do critério
        const lowerName = item.subject.toLowerCase();
        
        if (lowerName.includes('abordagem') || lowerName.includes('script') || lowerName.includes('emp') || lowerName.includes('cordial') || lowerName.includes('tom') || lowerName.includes('clareza') || lowerName.includes('escuta')) {
          category = 'Abordagem';
        } else if (lowerName.includes('aceite') || lowerName.includes('identificação') || lowerName.includes('dúvida') || lowerName.includes('agradece') || lowerName.includes('objeção')) {
          category = 'Check-list';
        } else if (lowerName.includes('confirmação') || lowerName.includes('endereço') || lowerName.includes('boleto') || lowerName.includes('vencimento') || lowerName.includes('aceitação') || lowerName.includes('identificou')) {
          category = 'Confirmação de dados';
        } else if (lowerName.includes('prazo') || lowerName.includes('vencimento') || lowerName.includes('acordo')) {
          category = 'Encerramento';
        } else if (lowerName.includes('valor') || lowerName.includes('juros') || lowerName.includes('multa') || lowerName.includes('origem') || lowerName.includes('motivo') || lowerName.includes('fechamento') || lowerName.includes('desconto')) {
          category = 'Negociação';
        } else {
          category = 'Outros';
        }
      }
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          criteria: [],
          averageScore: 0,
          totalCriteria: 0
        });
      }

      const categoryData = categoryMap.get(category)!;
      categoryData.criteria.push({
        name: item.subject,
        value: item.value,
        fullMark: item.fullMark
      });
    });

    // Calcula médias
    categoryMap.forEach(category => {
      if (category.criteria.length > 0) {
        const totalScore = category.criteria.reduce((sum, crit) => sum + crit.value, 0);
        category.averageScore = Math.round((totalScore / category.criteria.length) * 10) / 10;
        category.totalCriteria = category.criteria.length;
      }
    });

    return Array.from(categoryMap.values()).filter(cat => cat.criteria.length > 0);
  };

  const categoryData = groupByCategory();
  
  // Filtra dados para a categoria selecionada
  const getFilteredData = () => {
    if (selectedCategory === 'all') {
      return categoryData.map(cat => ({
        subject: cat.category,
        value: cat.averageScore,
        fullMark: 100,
        criteriaCount: cat.totalCriteria
      }));
    }
    
    const category = categoryData.find(cat => cat.category === selectedCategory);
    if (!category) return [];
    
    return category.criteria.map(crit => ({
      subject: crit.name,
      value: crit.value,
      fullMark: crit.fullMark
    }));
  };

  const chartData = getFilteredData();

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Desempenho por Critério
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedCategory === 'all' ? 'Visão geral por categoria' : `Critérios da categoria: ${selectedCategory}`}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveChart('radar')}
              className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${
                activeChart === 'radar' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <RadarIcon className="w-3 h-3" />
              Radar
            </button>
            <button
              onClick={() => setActiveChart('bar')}
              className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${
                activeChart === 'bar' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              Barras
            </button>
            <button
              className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
            >
              Debug Data
            </button>
          </div>
        </div>

        {/* Seletor de Categoria */}
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700 mr-3">Categoria:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Categorias</option>
            {categoryData.map(cat => (
              <option key={cat.category} value={cat.category}>
                {cat.category} ({cat.totalCriteria} critérios)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="h-64 sm:h-80" id="chart-container">
          {activeChart === 'radar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Pontuação"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <BarResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Bar dataKey="value" fill="#3b82f6" />
                <Tooltip />
              </BarChart>
            </BarResponsiveContainer>
          )}
        </div>
      </div>

      {/* Footer com estatísticas */}
      <div className="border-t p-4 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Total de Categorias:</span> {categoryData.length}
          </div>
          <div>
            <span className="font-medium">Total de Critérios:</span> {data.length}
          </div>
          <div>
            <span className="font-medium">Média Geral:</span> {Math.round((data.reduce((sum, item) => sum + item.value, 0) / data.length) * 10) / 10}
          </div>
          <div>
            <span className="font-medium">Categoria Selecionada:</span> {selectedCategory === 'all' ? 'Todas' : selectedCategory}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryRadarChart; 