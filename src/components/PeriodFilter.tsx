import React from 'react';
import { Calendar } from 'lucide-react';

interface PeriodFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<string>('custom');

  // Calcular datas baseadas no período selecionado
  const calculatePeriodDates = (period: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (period) {
      case 'hoje':
        const hojeStr = today.toISOString().split('T')[0];
        return { start: hojeStr, end: hojeStr };

      case 'ontem':
        const ontemStr = yesterday.toISOString().split('T')[0];
        return { start: ontemStr, end: ontemStr };

      case 'esta-semana':
        const inicioSemana = new Date(today);
        inicioSemana.setDate(today.getDate() - today.getDay());
        return {
          start: inicioSemana.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };

      case 'ultima-semana':
        const inicioUltimaSemana = new Date(today);
        inicioUltimaSemana.setDate(today.getDate() - today.getDay() - 7);
        const fimUltimaSemana = new Date(inicioUltimaSemana);
        fimUltimaSemana.setDate(inicioUltimaSemana.getDate() + 6);
        return {
          start: inicioUltimaSemana.toISOString().split('T')[0],
          end: fimUltimaSemana.toISOString().split('T')[0]
        };

      case 'este-mes':
        const inicioMes = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          start: inicioMes.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };

      case 'ultimo-mes':
        const inicioUltimoMes = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const fimUltimoMes = new Date(today.getFullYear(), today.getMonth(), 0);
        return {
          start: inicioUltimoMes.toISOString().split('T')[0],
          end: fimUltimoMes.toISOString().split('T')[0]
        };

      default:
        return { start: startDate, end: endDate };
    }
  };

  const handlePeriodChange = React.useCallback((period: string) => {
    console.log('🔍 [PERIOD FILTER DEBUG] Mudando período para:', period);
    setSelectedPeriod(period);
    
    if (period !== 'custom') {
      const dates = calculatePeriodDates(period);
      console.log('🔍 [PERIOD FILTER DEBUG] Datas calculadas:', dates);
      
      // Atualizar ambas as datas simultaneamente
      onStartDateChange(dates.start);
      onEndDateChange(dates.end);
    }
  }, [onStartDateChange, onEndDateChange]);

  const handleCustomDateChange = () => {
    setSelectedPeriod('custom');
  };

  // Detectar se as datas atuais correspondem a algum período pré-definido
  React.useEffect(() => {
    if (startDate && endDate) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const hojeStr = today.toISOString().split('T')[0];
      const ontemStr = yesterday.toISOString().split('T')[0];

      if (startDate === hojeStr && endDate === hojeStr) {
        setSelectedPeriod('hoje');
      } else if (startDate === ontemStr && endDate === ontemStr) {
        setSelectedPeriod('ontem');
      } else {
        // Verificar outros períodos se necessário
        setSelectedPeriod('custom');
      }
    }
  }, [startDate, endDate]);

  return (
    <div className="flex flex-col">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
        <Calendar className="h-3 w-3" />
        Período
      </label>
      
      {/* Dropdown de períodos pré-definidos */}
      <select
        value={selectedPeriod}
        onChange={(e) => handlePeriodChange(e.target.value)}
        className="h-10 border border-gray-300 rounded-xl px-3 text-sm shadow-sm bg-white !text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 mb-2"
      >
        <option value="hoje">Hoje</option>
        <option value="ontem">Ontem</option>
        <option value="esta-semana">Nesta semana</option>
        <option value="ultima-semana">Última semana</option>
        <option value="este-mes">Neste mês</option>
        <option value="ultimo-mes">Último mês</option>
        <option value="custom">Selecionar</option>
      </select>

      {/* Campos de data personalizada - só aparecem quando "Selecionar" está escolhido */}
      {selectedPeriod === 'custom' && (
        <div className="flex gap-2">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">Data Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                onStartDateChange(e.target.value);
                handleCustomDateChange();
              }}
              className="h-8 border border-gray-300 rounded-lg px-2 text-xs shadow-sm bg-white !text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">Data Fim</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                onEndDateChange(e.target.value);
                handleCustomDateChange();
              }}
              className="h-8 border border-gray-300 rounded-lg px-2 text-xs shadow-sm bg-white !text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodFilter;
