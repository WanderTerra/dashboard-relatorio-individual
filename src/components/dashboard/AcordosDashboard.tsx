import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAcordosResumo, getAcordosTrend, getAcordosMotivos, getAcordosValores, getAcordosAgentesRanking } from '../../lib/api';
import { 
	AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
	BarChart, Bar, PieChart, Pie, Cell, Legend, CartesianGrid 
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Users } from 'lucide-react';

export default function AcordosDashboard({ start, end, carteira }: { start?: string; end?: string; carteira?: string }) {
	const params = { ...(start ? { start } : {}), ...(end ? { end } : {}), ...(carteira ? { carteira } : {}) };
	
	
	const { data: resumo } = useQuery({ 
		queryKey: ['acordosResumo', params], 
		queryFn: async () => {
			try {
				return await getAcordosResumo(params);
			} catch (error: any) {
				if (error?.response?.status === 403) {
					console.warn('⚠️ Acesso negado para resumo de acordos - usuário sem permissão');
				}
				return null;
			}
		},
		retry: false
	});
	const { data: trend } = useQuery({ 
		queryKey: ['acordosTrend', params], 
		queryFn: async () => {
			try {
				return await getAcordosTrend(params);
			} catch (error: any) {
				if (error?.response?.status === 403) {
					console.warn('⚠️ Acesso negado para tendência de acordos - usuário sem permissão');
				}
				return [];
			}
		},
		retry: false
	});
	const { data: motivos } = useQuery({ 
		queryKey: ['acordosMotivos', params], 
		queryFn: async () => {
			try {
				return await getAcordosMotivos(params);
			} catch (error: any) {
				if (error?.response?.status === 403) {
					console.warn('⚠️ Acesso negado para motivos de acordos - usuário sem permissão');
				}
				return [];
			}
		},
		retry: false
	});
	const { data: valores } = useQuery({ 
		queryKey: ['acordosValores', params], 
		queryFn: async () => {
			try {
				return await getAcordosValores(params);
			} catch (error: any) {
				if (error?.response?.status === 403) {
					console.warn('⚠️ Acesso negado para valores de acordos - usuário sem permissão');
				}
				return [];
			}
		},
		retry: false
	});
	const { data: agentesRanking } = useQuery({ 
		queryKey: ['acordosAgentesRanking', params], 
		queryFn: async () => {
			try {
				return await getAcordosAgentesRanking(params);
			} catch (error: any) {
				if (error?.response?.status === 403) {
					console.warn('⚠️ Acesso negado para ranking de agentes - usuário sem permissão');
				}
				return [];
			}
		},
		retry: false
	});

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
	
	// Top 3 agentes mais efetivos
	const topAgentes = (agentesRanking || []).slice(0, 3);

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
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

				{/* Valores negociados - Linha */}
				<div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-4">Valores Negociados</h3>
					<ResponsiveContainer width="100%" height={280}>
						<LineChart data={valores || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
							<XAxis dataKey="dia" tick={{ fontSize: 12 }} />
							<YAxis 
								tick={{ fontSize: 12 }} 
								tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
							/>
							<Tooltip 
								formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
								contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
							/>
							<Legend />
							<Line 
								type="monotone" 
								dataKey="valor_total_acordos" 
								name="Total Negociado"
								stroke="#10B981" 
								strokeWidth={3}
								dot={{ fill: '#10B981', r: 4 }}
							/>
							<Line 
								type="monotone" 
								dataKey="valor_medio_acordo" 
								name="Valor Médio"
								stroke="#3B82F6" 
								strokeWidth={2}
								strokeDasharray="5 5"
								dot={{ fill: '#3B82F6', r: 3 }}
							/>
						</LineChart>
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

			{/* Ranking de agentes mais efetivos - DESTAQUE */}
			<div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl shadow-xl border-2 border-emerald-200 p-6">
				<div className="flex items-center gap-3 mb-6">
					<div className="bg-emerald-500 rounded-full p-2">
						<Target className="h-6 w-6 text-white" />
					</div>
					<h3 className="text-xl font-bold text-emerald-900">🏆 Agentes Mais Efetivos em Acordos</h3>
				</div>
				
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{topAgentes.map((agente, index) => {
						const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Ouro, Prata, Bronze
						const bgColors = ['from-yellow-50 to-yellow-100', 'from-gray-50 to-gray-100', 'from-orange-50 to-orange-100'];
						const textColors = ['text-yellow-900', 'text-gray-900', 'text-orange-900'];
						const borderColors = ['border-yellow-300', 'border-gray-300', 'border-orange-300'];
						
						return (
							<div key={agente.agent_id} className={`bg-gradient-to-br ${bgColors[index]} rounded-lg p-4 border-2 ${borderColors[index]} relative overflow-hidden`}>
								{/* Medalha */}
								<div className="absolute top-2 right-2">
									<div 
										className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
										style={{ backgroundColor: medalColors[index] }}
									>
										{index + 1}
									</div>
								</div>
								
								{/* Dados do agente */}
								<div className="pr-10">
									<h4 className={`font-bold text-lg ${textColors[index]} truncate`}>
										{agente.nome_agente}
									</h4>
									<div className="mt-2 space-y-1">
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Taxa:</span>
											<span className={`font-bold ${textColors[index]}`}>{agente.taxa_acordo.toFixed(1)}%</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Acordos:</span>
											<span className={`font-semibold ${textColors[index]}`}>{agente.acordos}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Ligações:</span>
											<span className="text-sm text-gray-700">{agente.total_ligacoes}</span>
										</div>
									</div>
								</div>
								
								{/* Barra de progresso */}
								<div className="mt-3 bg-white bg-opacity-50 rounded-full h-2 overflow-hidden">
									<div 
										className="h-full rounded-full transition-all duration-700"
										style={{ 
											width: `${agente.taxa_acordo}%`,
											backgroundColor: medalColors[index]
										}}
									/>
								</div>
							</div>
						);
					})}
				</div>
				
				{/* Lista completa do ranking */}
				{agentesRanking && agentesRanking.length > 3 && (
					<div className="mt-6 bg-white rounded-lg p-4 border border-emerald-200">
						<h4 className="font-semibold text-gray-900 mb-3">Ranking Completo</h4>
						<div className="space-y-2">
							{agentesRanking.slice(3).map((agente, index) => (
								<div key={agente.agent_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
									<div className="flex items-center gap-3">
										<span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
											{index + 4}
										</span>
										<span className="font-medium text-gray-900">{agente.nome_agente}</span>
									</div>
									<div className="flex items-center gap-4 text-sm">
										<span className="text-emerald-600 font-semibold">{agente.taxa_acordo.toFixed(1)}%</span>
										<span className="text-gray-500">{agente.acordos}/{agente.total_ligacoes}</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
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
