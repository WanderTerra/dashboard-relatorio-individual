import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import MetricCard from './components/MetricCard';
import MonthlyChart from './components/MonthlyChart';
import AgentsList from './components/AgentsList';
import { 
  Activity, 
  Phone, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';

function App() {
  // Dados simulados para o dashboard
  const [dailyScore] = useState(78);
  const [callsCount] = useState(124);
  const [conformityRate] = useState(65);
  
  // Dados simulados para o gráfico mensal
  const [monthlyData] = useState([
    { name: 'Jan', score: 72 },
    { name: 'Fev', score: 68 },
    { name: 'Mar', score: 75 },
    { name: 'Abr', score: 82 },
    { name: 'Mai', score: 78 },
    { name: 'Jun', score: 80 },
    { name: 'Jul', score: 74 },
    { name: 'Ago', score: 76 },
    { name: 'Set', score: 78 },
    { name: 'Out', score: 81 },
    { name: 'Nov', score: 83 },
    { name: 'Dez', score: 79 },
  ]);
  
  // Dados simulados para a lista de agentes
  const [agentsData] = useState([
    { id: 1, name: 'Carlos Silva', score: 45, calls: 28, status: 'Não Conforme' },
    { id: 2, name: 'Ana Oliveira', score: 52, calls: 35, status: 'Não Conforme' },
    { id: 3, name: 'Roberto Santos', score: 58, calls: 42, status: 'Não Conforme' },
    { id: 4, name: 'Juliana Costa', score: 60, calls: 31, status: 'Atenção' },
    { id: 5, name: 'Marcos Pereira', score: 62, calls: 27, status: 'Atenção' },
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard 
            title="Pontuação do Dia" 
            value={dailyScore} 
            icon={<Activity className="h-8 w-8 text-blue-600" />} 
            suffix="pts" 
            description="Média de pontuação das ligações avaliadas hoje"
            trend={dailyScore > 75 ? 'up' : 'down'}
          />
          <MetricCard 
            title="Quantidade de Ligações" 
            value={callsCount} 
            icon={<Phone className="h-8 w-8 text-green-600" />} 
            description="Total de ligações avaliadas hoje"
          />
          <MetricCard 
            title="Situação" 
            value={conformityRate} 
            icon={conformityRate >= 70 ? 
              <CheckCircle className="h-8 w-8 text-green-600" /> : 
              <XCircle className="h-8 w-8 text-red-600" />
            } 
            suffix="%" 
            description={conformityRate >= 70 ? "Ligações conformes" : "Atenção: Taxa de conformidade baixa"}
            trend={conformityRate >= 70 ? 'up' : 'down'}
            trendColor={conformityRate >= 70 ? 'text-green-600' : 'text-red-600'}
          />
        </div>
        
        {/* Gráfico mensal */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Pontuação Mensal</h2>
          <div className="h-80">
            <MonthlyChart data={monthlyData} />
          </div>
        </div>
        
        {/* Lista de agentes com piores notas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            <span className="text-red-600 mr-2">⚠️</span> 
            Área de Atenção: Agentes com Baixo Desempenho
          </h2>
          <AgentsList agents={agentsData} />
        </div>
      </main>
    </div>
  );
}

export default App;
