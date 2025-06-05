"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_router_dom_1 = require("react-router-dom");
var lucide_react_1 = require("lucide-react");
var recharts_1 = require("recharts");
var format_1 = require("../lib/format");
var AgentReport = function () {
    var agentId = (0, react_router_dom_1.useParams)().agentId;
    var navigate = (0, react_router_dom_1.useNavigate)();
    // Dados simulados para o relatório individual
    var agentData = {
        id: parseInt(agentId || '1'),
        name: 'Carlos Silva',
        callTime: '2025-05-19T14:30:00',
        callDuration: '12:45',
        finalScore: 45,
        criteria: [
            {
                id: 'abordagem_atendeu',
                name: '1. Abordagem',
                description: 'Atendeu prontamente?',
                value: 30,
                status: 'nao_conforme',
                conditional: false
            },
            {
                id: 'seguranca_info_corretas',
                name: '2. Segurança',
                description: 'Atendimento seguro, sem informações falsas?',
                value: 40,
                status: 'nao_conforme',
                conditional: false
            },
            {
                id: 'fraseologia_explica_motivo',
                name: '3. Fraseologia',
                description: 'Explicou motivo de ausência/transferência?',
                value: 60,
                status: 'conforme',
                conditional: false
            },
            {
                id: 'comunicacao_tom_adequado',
                name: '4. Comunicação',
                description: 'Tom de voz adequado, linguagem clara, sem gírias?',
                value: 50,
                status: 'nao_conforme',
                conditional: false
            },
            {
                id: 'cordialidade_respeito',
                name: '5. Cordialidade',
                description: 'Respeitoso, sem comentários impróprios?',
                value: 70,
                status: 'conforme',
                conditional: false
            },
            {
                id: 'empatia_genuina',
                name: '6. Empatia',
                description: 'Demonstrou empatia genuína?',
                value: 40,
                status: 'nao_conforme',
                conditional: false
            },
            {
                id: 'escuta_sem_interromper',
                name: '7. Escuta Ativa',
                description: 'Ouviu sem interromper, retomando pontos?',
                value: 30,
                status: 'nao_conforme',
                conditional: false
            },
            {
                id: 'clareza_direta',
                name: '8. Clareza & Objetividade',
                description: 'Explicações diretas, sem rodeios?',
                value: 60,
                status: 'conforme',
                conditional: false
            },
            {
                id: 'oferta_valores_corretos',
                name: '9. Oferta de Solução',
                description: 'Apresentou valores, descontos e opções corretamente?',
                value: 20,
                status: 'nao_conforme',
                conditional: true,
                conditionalText: 'Aplica-se só se cliente permitir'
            },
            {
                id: 'confirmacao_aceite',
                name: '10. Confirmação de Aceite',
                description: 'Confirmou negociação com "sim, aceito/confirmo"?',
                value: 0,
                status: 'nao_aplicavel',
                conditional: true,
                conditionalText: 'Aplica-se só se houve negociação'
            },
            {
                id: 'reforco_prazo',
                name: '11. Reforço de Prazo',
                description: 'Reforçou data-limite e perda de desconto?',
                value: 0,
                status: 'nao_aplicavel',
                conditional: true,
                conditionalText: 'Aplica-se só se fechou acordo'
            },
            {
                id: 'encerramento_agradece',
                name: '12. Encerramento',
                description: 'Perguntou "Posso ajudar em algo mais?" e agradeceu?',
                value: 0,
                status: 'nao_aplicavel',
                conditional: true,
                conditionalText: 'Aplica-se só se fechou acordo'
            }
        ]
    };
    // Formatar dados para o gráfico de radar
    var radarData = agentData.criteria
        .filter(function (criterion) { return criterion.status !== 'nao_aplicavel'; })
        .map(function (criterion) { return ({
        subject: criterion.name.split('.')[1].trim(),
        A: criterion.value,
        fullMark: 100
    }); });
    // Formatar data e hora
    var formatDateTime = function (dateTimeString) {
        var date = new Date(dateTimeString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    // Obter status visual
    var getStatusBadge = function (status) {
        switch (status) {
            case 'conforme':
                return ((0, jsx_runtime_1.jsx)("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800", children: (0, format_1.formatItemName)(status) }));
            case 'nao_conforme':
                return ((0, jsx_runtime_1.jsx)("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800", children: (0, format_1.formatItemName)(status) }));
            case 'nao_aplicavel':
                return ((0, jsx_runtime_1.jsx)("span", { className: "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800", children: (0, format_1.formatItemName)(status) }));
            default:
                return null;
        }
    };
    // Obter cor do score
    var getScoreColor = function (score) {
        if (score < 60)
            return 'text-red-600';
        if (score < 70)
            return 'text-yellow-600';
        return 'text-green-600';
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-gray-100", children: [(0, jsx_runtime_1.jsx)("header", { className: "bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg", children: (0, jsx_runtime_1.jsx)("div", { className: "container mx-auto px-4 py-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("button", { onClick: function () { return navigate('/'); }, className: "mr-4 p-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { size: 20 }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl md:text-3xl font-bold", children: "Relat\u00F3rio Individual de Avalia\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)("p", { className: "text-blue-100 mt-1", children: "Detalhes de desempenho e pontos de melhoria" })] })] }) }) }), (0, jsx_runtime_1.jsxs)("main", { className: "container mx-auto px-4 py-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow-md p-6 mb-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4", children: (0, jsx_runtime_1.jsx)(lucide_react_1.User, { className: "h-6 w-6 text-indigo-700" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-medium text-gray-500", children: "Agente" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-semibold", children: (0, format_1.formatAgentName)(agentData) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-6 w-6 text-indigo-700" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-medium text-gray-500", children: "Data e Hora" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-semibold", children: formatDateTime(agentData.callTime) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Phone, { className: "h-6 w-6 text-indigo-700" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-medium text-gray-500", children: "Dura\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-semibold", children: agentData.callDuration })] })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "md:col-span-2 bg-white rounded-lg shadow-md p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center mb-4", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.BarChart2, { className: "h-6 w-6 text-indigo-700 mr-2" }), (0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold", children: "Desempenho da Liga\u00E7\u00E3o" })] }), (0, jsx_runtime_1.jsx)("div", { className: "h-80", children: (0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.RadarChart, { cx: "50%", cy: "50%", outerRadius: "80%", data: radarData, children: [(0, jsx_runtime_1.jsx)(recharts_1.PolarGrid, {}), (0, jsx_runtime_1.jsx)(recharts_1.PolarAngleAxis, { dataKey: "subject", tick: { fill: '#6b7280', fontSize: 12 } }), (0, jsx_runtime_1.jsx)(recharts_1.PolarRadiusAxis, { angle: 30, domain: [0, 100] }), (0, jsx_runtime_1.jsx)(recharts_1.Radar, { name: "Pontua\u00E7\u00E3o", dataKey: "A", stroke: "#4f46e5", fill: "#4f46e5", fillOpacity: 0.6 }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { formatter: function (value) { return ["".concat(value, "%"), 'Pontuação']; } })] }) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow-md p-6 flex flex-col justify-center items-center", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold mb-4", children: "Nota Final" }), (0, jsx_runtime_1.jsx)("div", { className: "text-6xl font-bold ".concat(getScoreColor(agentData.finalScore)), children: agentData.finalScore }), (0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-medium text-gray-500 mt-2", children: "pontos" }), (0, jsx_runtime_1.jsx)("div", { className: "w-full bg-gray-200 rounded-full h-4 mt-6", children: (0, jsx_runtime_1.jsx)("div", { className: "h-4 rounded-full ".concat(agentData.finalScore < 60 ? 'bg-red-600' :
                                                agentData.finalScore < 70 ? 'bg-yellow-500' : 'bg-green-600'), style: { width: "".concat(agentData.finalScore, "%") } }) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4 text-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-lg font-medium ".concat(getScoreColor(agentData.finalScore)), children: agentData.finalScore < 60 ? 'Não Conforme' :
                                                agentData.finalScore < 70 ? 'Atenção' : 'Conforme' }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow-md p-6", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold mb-6", children: "Crit\u00E9rios de Avalia\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: agentData.criteria.map(function (criterion) { return ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 rounded-lg border ".concat(criterion.status === 'nao_conforme' ? 'border-red-200 bg-red-50' :
                                        criterion.status === 'conforme' ? 'border-green-200 bg-green-50' :
                                            'border-gray-200 bg-gray-50'), children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium", children: (0, format_1.formatItemName)(criterion.id) }), getStatusBadge(criterion.status)] }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mt-2", children: criterion.description }), criterion.status !== 'nao_aplicavel' && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between text-sm mb-1", children: [(0, jsx_runtime_1.jsx)("span", { children: "Pontua\u00E7\u00E3o" }), (0, jsx_runtime_1.jsxs)("span", { className: "font-medium", children: [criterion.value, "%"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full bg-gray-200 rounded-full h-2", children: (0, jsx_runtime_1.jsx)("div", { className: "h-2 rounded-full ".concat(criterion.value < 60 ? 'bg-red-600' :
                                                            criterion.value < 70 ? 'bg-yellow-500' : 'bg-green-600'), style: { width: "".concat(criterion.value, "%") } }) })] })), criterion.conditional && ((0, jsx_runtime_1.jsx)("div", { className: "mt-2 text-sm text-gray-500 italic", children: criterion.conditionalText }))] }, criterion.id)); }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow-md p-6 mt-6", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-xl font-semibold mb-4", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-red-600 mr-2", children: "\u26A0\uFE0F" }), "Pontos de Melhoria"] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: agentData.criteria
                                    .filter(function (criterion) { return criterion.status === 'nao_conforme'; })
                                    .map(function (criterion) { return ((0, jsx_runtime_1.jsxs)("div", { className: "p-4 bg-red-50 rounded-lg border border-red-200", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-medium text-red-800", children: (0, format_1.formatItemName)(criterion.id) }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-700 mt-1", children: criterion.description }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2 text-sm text-gray-600", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Sugest\u00E3o de melhoria:" }), " Revisar procedimentos de ", (0, format_1.formatItemName)(criterion.id).toLowerCase(), " e praticar com exemplos."] })] }, "improvement-".concat(criterion.id))); }) })] })] })] }));
};
exports.default = AgentReport;
