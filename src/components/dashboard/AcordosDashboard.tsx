import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAcordosResumo, getAcordosTrend, getAcordosMotivos } from '../../lib/api';
import { 
	AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
	BarChart, Bar, PieChart, Pie, Cell, Legend, CartesianGrid 
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Users } from 'lucide-react';

export default function AcordosDashboard({ start, end, carteira }: { start?: string; end?: string; carteira?: string }) {
	const params = { ...(start ? { start } : {}), ...(end ? { end } : {}), ...(carteira ? { carteira } : {}) };
	const { data: resumo } = useQuery({ queryKey: ['acordosResumo', params], queryFn: () => getAcordosResumo(params) });
	const { data: trend } = useQuery({ queryKey: ['acordosTrend', params], queryFn: () => getAcordosTrend(params) });
	const { data: motivos } = useQuery({ queryKey: ['acordosMotivos', params], queryFn: () => getAcordosMotivos(params) });

	const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
	const GRADIENT_COLORS = ['#10B981', '#34D399', '#6EE7B7'];

	// Calcular tendência (últimos vs anteriores)
	const trendData = trend || [];
	const metade = Math.floor(trendData.length / 2);
	const taxaAnterior = metade > 0 ? trendData.slice(0, metade).reduce((acc, d) => acc + (d.taxa || 0), 0) / metade : 0;
	const taxaRecente = metade > 0 ? trendData.slice(metade).reduce((acc, d) => acc + (d.taxa || 0), 0) / (trendData.length - metade) : 0;
	const tendencia = taxaRecente - taxaAnterior;

	// Preparar dados para barras horizontais (top 5 motivos)
	const motivosTop = (motivos || []).slice(0, 5);

	return (
		<div className="space-y-6">
			{/* Cards de KPI */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-emerald-600 text-sm font-medium">Taxa de Acordos</p>
							<p className="text-2xl font-bold text-emerald-900">{(resumo?.taxa ?? 0).toFixed(1)}%</p>
						</div>
						<Target className="h-8 w-8 text-emerald-500" />
					</div>
				</div>

				<div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-blue-600 text-sm font-medium">Total Acordos</p>
							<p className="text-2xl font-bold text-blue-900">{resumo?.acordos ?? 0}</p>
						</div>
						<Users className="h-8 w-8 text-blue-500" />
					</div>
				</div>

				<div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-purple-600 text-sm font-medium">Total Ligações</p>
							<p className="text-2xl font-bold text-purple-900">{resumo?.total ?? 0}</p>
						</div>
						<Users className="h-8 w-8 text-purple-500" />
					</div>
				</div>

				<div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-orange-600 text-sm font-medium">Tendência</p>
							<div className="flex items-center gap-1">
								<p className="text-2xl font-bold text-orange-900">{tendencia > 0 ? '+' : ''}{tendencia.toFixed(1)}%</p>
								{tendencia >= 0 ? 
									<TrendingUp className="h-4 w-4 text-green-500" /> : 
									<TrendingDown className="h-4 w-4 text-red-500" />
								}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Gráficos principais */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Gráfico de área - Taxa de acordos */}
				<div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Acordos por Dia</h3>
					<ResponsiveContainer width="100%" height={300}>
						<AreaChart data={trendData}>
							<defs>
								<linearGradient id="acordosGradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
									<stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
							<XAxis dataKey="dia" tick={{ fontSize: 12 }} />
							<YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
							<Tooltip 
								formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa de Acordos']}
								labelStyle={{ color: '#374151' }}
								contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
							/>
							<Area 
								type="monotone" 
								dataKey="taxa" 
								stroke="#10B981" 
								strokeWidth={2}
								fill="url(#acordosGradient)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>

				{/* Donut chart - Distribuição */}
				<div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Resultados</h3>
					<ResponsiveContainer width="100%" height={300}>
						<PieChart>
							<Pie
								data={[
									{ name: 'Acordos', value: resumo?.acordos ?? 0, color: '#10B981' },
									{ name: 'Sem Acordo', value: (resumo?.total ?? 0) - (resumo?.acordos ?? 0), color: '#EF4444' }
								]}
								cx="50%"
								cy="50%"
								innerRadius={60}
								outerRadius={100}
								paddingAngle={5}
								dataKey="value"
							>
								{[{ color: '#10B981' }, { color: '#EF4444' }].map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
							</Pie>
							<Tooltip formatter={(value: number) => [value, '']} />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Gráficos secundários */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Volume por dia - Barras */}
				<div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Volume Diário</h3>
					<ResponsiveContainer width="100%" height={280}>
						<BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
							<XAxis dataKey="dia" tick={{ fontSize: 12 }} />
							<YAxis tick={{ fontSize: 12 }} />
							<Tooltip 
								contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
							/>
							<Legend />
							<Bar dataKey="acordos" name="Acordos" fill="#10B981" radius={[4, 4, 0, 0]} />
							<Bar dataKey="total" name="Total" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>

				{/* Top motivos - Barras horizontais */}
				<div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Top Motivos de Não Acordo</h3>
					<div className="space-y-3">
						{motivosTop.map((motivo, index) => {
							const maxQtd = Math.max(...motivosTop.map(m => m.qtd));
							const percentage = (motivo.qtd / maxQtd) * 100;
							return (
								<div key={motivo.motivo} className="flex items-center gap-3">
									<div className="w-32 text-sm font-medium text-gray-700 truncate">
										{motivo.motivo.replace(/_/g, ' ')}
									</div>
									<div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
										<div 
											className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
											style={{ 
												width: `${percentage}%`, 
												backgroundColor: COLORS[index % COLORS.length] 
											}}
										>
											<span className="text-white text-xs font-medium">{motivo.qtd}</span>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Resumo detalhado */}
			<div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
					<div>
						<p className="text-2xl font-bold text-gray-900">{resumo?.total ?? 0}</p>
						<p className="text-sm text-gray-600">Total de Ligações</p>
					</div>
					<div>
						<p className="text-2xl font-bold text-emerald-600">{resumo?.acordos ?? 0}</p>
						<p className="text-sm text-gray-600">Acordos Fechados</p>
					</div>
					<div>
						<p className="text-2xl font-bold text-red-600">{(resumo?.total ?? 0) - (resumo?.acordos ?? 0)}</p>
						<p className="text-sm text-gray-600">Sem Acordo</p>
					</div>
					<div>
						<p className="text-2xl font-bold text-blue-600">{(resumo?.taxa ?? 0).toFixed(1)}%</p>
						<p className="text-sm text-gray-600">Taxa de Sucesso</p>
					</div>
				</div>
			</div>
		</div>
	);
}
