"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
require("./App.css");
var Header_1 = require("./components/Header");
var MetricCard_1 = require("./components/MetricCard");
var MonthlyChart_1 = require("./components/MonthlyChart");
var AgentsList_1 = require("./components/AgentsList");
var lucide_react_1 = require("lucide-react");
function App() {
    // Dados simulados para o dashboard
    var dailyScore = (0, react_1.useState)(78)[0];
    var callsCount = (0, react_1.useState)(124)[0];
    var conformityRate = (0, react_1.useState)(65)[0];
    // Dados simulados para o gráfico mensal
    var monthlyData = (0, react_1.useState)([
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
    ])[0];
    // Dados simulados para a lista de agentes
    var agentsData = (0, react_1.useState)([
        { id: 1, name: 'Carlos Silva', score: 45, calls: 28, status: 'Não Conforme' },
        { id: 2, name: 'Ana Oliveira', score: 52, calls: 35, status: 'Não Conforme' },
        { id: 3, name: 'Roberto Santos', score: 58, calls: 42, status: 'Não Conforme' },
        { id: 4, name: 'Juliana Costa', score: 60, calls: 31, status: 'Atenção' },
        { id: 5, name: 'Marcos Pereira', score: 62, calls: 27, status: 'Atenção' },
    ])[0];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-gray-100", children: [(0, jsx_runtime_1.jsx)(Header_1.default, {}), (0, jsx_runtime_1.jsxs)("main", { className: "container mx-auto px-4 py-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [(0, jsx_runtime_1.jsx)(MetricCard_1.default, { title: "Pontua\u00E7\u00E3o do Dia", value: dailyScore, icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Activity, { className: "h-8 w-8 text-blue-600" }), suffix: "pts", description: "M\u00E9dia de pontua\u00E7\u00E3o das liga\u00E7\u00F5es avaliadas hoje", trend: dailyScore > 75 ? 'up' : 'down' }), (0, jsx_runtime_1.jsx)(MetricCard_1.default, { title: "Quantidade de Liga\u00E7\u00F5es", value: callsCount, icon: (0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-8 w-8 text-green-600" }), description: "Total de liga\u00E7\u00F5es avaliadas hoje" }), (0, jsx_runtime_1.jsx)(MetricCard_1.default, { title: "Situa\u00E7\u00E3o", value: conformityRate, icon: conformityRate >= 70 ?
                                    (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "h-8 w-8 text-green-600" }) :
                                    (0, jsx_runtime_1.jsx)(lucide_react_1.XCircle, { className: "h-8 w-8 text-red-600" }), suffix: "%", description: conformityRate >= 70 ? "Ligações conformes" : "Atenção: Taxa de conformidade baixa", trend: conformityRate >= 70 ? 'up' : 'down', trendColor: conformityRate >= 70 ? 'text-green-600' : 'text-red-600' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow-md p-6 mb-8", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold mb-4", children: "Pontua\u00E7\u00E3o Mensal" }), (0, jsx_runtime_1.jsx)("div", { className: "h-80", children: (0, jsx_runtime_1.jsx)(MonthlyChart_1.default, { data: monthlyData }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow-md p-6", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-xl font-semibold mb-4", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-red-600 mr-2", children: "\u26A0\uFE0F" }), "\u00C1rea de Aten\u00E7\u00E3o: Agentes com Baixo Desempenho"] }), (0, jsx_runtime_1.jsx)(AgentsList_1.default, { agents: agentsData })] })] })] }));
}
exports.default = App;
