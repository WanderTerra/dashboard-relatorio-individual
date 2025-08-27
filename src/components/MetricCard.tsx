import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    period: string;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  value,
  label,
  trend,
  color = 'blue',
  size = 'md',
  loading = false
}) => {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      purple: 'from-purple-500 to-purple-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getSizeClasses = (size: string) => {
    const sizes = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const getIconSize = (size: string) => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const getValueSize = (size: string) => {
    const sizes = {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl'
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const getLabelSize = (size: string) => {
    const sizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${getSizeClasses(size)}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  const renderTrend = () => {
    if (!trend) return null;

    const isPositive = trend.value > 0;
    const isNegative = trend.value < 0;
    const isNeutral = trend.value === 0;

    return (
      <div className={`flex items-center gap-1 text-xs font-medium ${
        isPositive ? 'text-green-600' : 
        isNegative ? 'text-red-600' : 
        'text-gray-500'
      }`}>
        {isPositive && <TrendingUp className="h-3 w-3" />}
        {isNegative && <TrendingDown className="h-3 w-3" />}
        {isNeutral && <Minus className="h-3 w-3" />}
        <span>
          {isPositive ? '+' : ''}{trend.value}%
        </span>
        <span className="text-gray-400">vs {trend.period}</span>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${getSizeClasses(size)} hover:shadow-md transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 bg-gradient-to-r ${getColorClasses(color)} rounded-lg shadow-sm`}>
          <div className={`text-white ${getIconSize(size)}`}>
            {icon}
          </div>
        </div>
        {trend && renderTrend()}
      </div>
      
      <div className={`font-bold text-gray-900 ${getValueSize(size)} mb-1`}>
        {value}
      </div>
      
      <div className={`text-gray-600 font-medium ${getLabelSize(size)}`}>
        {label}
      </div>
    </div>
  );
};

export default MetricCard;
