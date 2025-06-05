"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var react_query_1 = require("@tanstack/react-query");
var api_1 = require("../lib/api");
var CallList_1 = require("../components/CallList");
var SummaryCard_1 = require("../components/ui/SummaryCard");
var format_1 = require("../lib/format");
var AgentDetail = function () {
    var _a, _b;
    var agentId = (0, react_router_dom_1.useParams)().agentId;
    if (!agentId)
        return (0, jsx_runtime_1.jsx)("div", { children: "Agente n\u00E3o especificado." }); // datas padrão - usando período fixo maior para garantir que dados apareçam
    var _c = (0, react_1.useState)("2024-01-01"), start = _c[0], setStart = _c[1];
    var _d = (0, react_1.useState)("2025-12-31"), end = _d[0], setEnd = _d[1];
    var filters = { start: start, end: end };
    console.log("Usando filtros fixos:", filters);
    // summary
    var _e = (0, react_query_1.useQuery)({
        queryKey: ['agentSummary', agentId, filters],
        queryFn: function () {
            console.log("Buscando resumo para agente ".concat(agentId, " com filtros:"), filters);
            return (0, api_1.getAgentSummary)(agentId, filters).then(function (data) {
                console.log('Dados recebidos do agente:', data);
                return data;
            });
        },
    }), summary = _e.data, summaryLoading = _e.isLoading, summaryError = _e.error;
    // calls
    var _f = (0, react_query_1.useQuery)({
        queryKey: ['agentCalls', agentId, filters],
        queryFn: function () {
            console.log("Buscando chamadas para agente ".concat(agentId, " com filtros:"), filters);
            return (0, api_1.getAgentCalls)(agentId, filters);
        },
    }), calls = _f.data, callsLoading = _f.isLoading, callsError = _f.error;
    // worst item
    var _g = (0, react_query_1.useQuery)({
        queryKey: ['agentWorstItem', agentId, filters],
        queryFn: function () {
            console.log("Buscando pior item para agente ".concat(agentId, " com filtros:"), filters);
            return (0, api_1.getAgentWorstItem)(agentId, filters);
        },
    }), worstItem = _g.data, wiLoading = _g.isLoading, wiError = _g.error;
    // Log de erros
    react_1.default.useEffect(function () {
        if (summaryError)
            console.error('Erro ao buscar resumo:', summaryError);
        if (callsError)
            console.error('Erro ao buscar chamadas:', callsError);
        if (wiError)
            console.error('Erro ao buscar pior item:', wiError);
    }, [summaryError, callsError, wiError]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "p-6 space-y-6", children: [(0, jsx_runtime_1.jsx)(react_router_dom_1.Link, { to: "/", className: "px-4 py-2 bg-blue-600 text-white rounded", children: "\u2190 Voltar" }), "      ", "      ", summaryLoading
                ? (0, jsx_runtime_1.jsx)("p", { children: "Carregando informa\u00E7\u00F5es do agente\u2026" })
                : ((0, jsx_runtime_1.jsx)(SummaryCard_1.default, { name: (0, format_1.formatAgentName)(summary), title: "Agente ".concat(agentId), subtitle: "", media: (_a = summary === null || summary === void 0 ? void 0 : summary.media) !== null && _a !== void 0 ? _a : 0, total: (_b = summary === null || summary === void 0 ? void 0 : summary.ligacoes) !== null && _b !== void 0 ? _b : 0 })), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-xs", children: "In\u00EDcio" }), (0, jsx_runtime_1.jsx)("input", { type: "date", value: start, onChange: function (e) { return setStart(e.target.value); }, className: "border rounded p-1" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-xs", children: "Fim" }), (0, jsx_runtime_1.jsx)("input", { type: "date", value: end, onChange: function (e) { return setEnd(e.target.value); }, className: "border rounded p-1" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-4 rounded shadow", children: [(0, jsx_runtime_1.jsx)("h2", { className: "font-semibold mb-2", children: "Pior Item Avaliado" }), wiLoading
                        ? (0, jsx_runtime_1.jsx)("p", { children: "Carregando\u2026" })
                        : worstItem
                            ? ((0, jsx_runtime_1.jsxs)("p", { children: [(0, jsx_runtime_1.jsx)("strong", { children: (0, format_1.formatItemName)(worstItem.categoria) }), " \u2014 taxa de n\u00E3o conformidade de", ' ', (worstItem.taxa_nao_conforme * 100).toFixed(1), "%"] }))
                            : (0, jsx_runtime_1.jsx)("p", { children: "Sem dados de avalia\u00E7\u00E3o." })] }), callsLoading
                ? (0, jsx_runtime_1.jsx)("p", { children: "Carregando chamadas\u2026" })
                : (0, jsx_runtime_1.jsx)(CallList_1.default, { calls: calls !== null && calls !== void 0 ? calls : [] })] }));
};
exports.default = AgentDetail;
