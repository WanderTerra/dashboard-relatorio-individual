"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var date_fns_1 = require("date-fns");
var react_query_1 = require("@tanstack/react-query");
var react_router_dom_1 = require("react-router-dom");
var KpiCards_1 = require("../components/KpiCards");
var TrendLineChart_1 = require("../components/TrendLineChart");
var select_simple_1 = require("../components/ui/select-simple");
var api_1 = require("../lib/api");
var format_1 = require("../lib/format");
// Usar os últimos 6 meses em vez de apenas o mês atual
var today = new Date();
var sixMonthsAgo = new Date(today);
sixMonthsAgo.setMonth(today.getMonth() - 6);
// Lista de carteiras disponíveis - pode ser expandida no futuro
var carteiras = [
    { value: 'AGUAS', label: 'AGUAS' },
    { value: 'VUON', label: 'VUON' },
];
var Dashboard = function () {
    var _a, _b, _c, _d;
    var _e = (0, react_1.useState)((0, date_fns_1.formatISO)(sixMonthsAgo, { representation: 'date' })), start = _e[0], setStart = _e[1];
    var _f = (0, react_1.useState)((0, date_fns_1.formatISO)(today, { representation: 'date' })), end = _f[0], setEnd = _f[1];
    var _g = (0, react_1.useState)(''), carteira = _g[0], setCart = _g[1];
    var filters = __assign({ start: start, end: end }, (carteira ? { carteira: carteira } : {}));
    // KPIs e tendência
    var kpis = (0, react_query_1.useQuery)({ queryKey: ['kpis', filters], queryFn: function () { return (0, api_1.getKpis)(filters); } }).data;
    var trend = (0, react_query_1.useQuery)({ queryKey: ['trend', filters], queryFn: function () { return (0, api_1.getTrend)(filters); } }).data;
    var agents = (0, react_query_1.useQuery)({ queryKey: ['agents', filters], queryFn: function () { return (0, api_1.getAgents)(filters); } }).data;
    // Para cada agente, dispara uma query para obter o pior item
    var worstItemQueries = (0, react_query_1.useQueries)({
        queries: (_a = agents === null || agents === void 0 ? void 0 : agents.map(function (agent) { return ({
            queryKey: ['agentWorstItem', agent.agent_id, filters],
            queryFn: function () { return (0, api_1.getAgentWorstItem)(agent.agent_id, filters); },
            enabled: !!agents,
            staleTime: 5 * 60000,
        }); })) !== null && _a !== void 0 ? _a : [],
    });
    return ((0, jsx_runtime_1.jsxs)("div", { className: "p-6 space-y-6", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold", children: "Avalia\u00E7\u00E3o de Liga\u00E7\u00F5es" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-4", children: ["        ", (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-xs", children: "In\u00EDcio" }), (0, jsx_runtime_1.jsx)("input", { type: "date", value: start, onChange: function (e) { return setStart(e.target.value); }, className: "border rounded p-1" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-xs", children: "Fim" }), (0, jsx_runtime_1.jsx)("input", { type: "date", value: end, onChange: function (e) { return setEnd(e.target.value); }, className: "border rounded p-1" })] }), "        ", (0, jsx_runtime_1.jsxs)("div", { className: "min-w-[200px]", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-xs mb-1", children: "Carteira" }), (0, jsx_runtime_1.jsx)(select_simple_1.Combobox, { options: carteiras, value: carteira, onChange: function (value) {
                                    console.log('Carteira selecionada:', value);
                                    setCart(value);
                                }, placeholder: "Selecionar carteira", emptyMessage: "Nenhuma carteira encontrada" })] })] }), (0, jsx_runtime_1.jsx)(KpiCards_1.default, { media: (_b = kpis === null || kpis === void 0 ? void 0 : kpis.media_geral) !== null && _b !== void 0 ? _b : null, total: (_c = kpis === null || kpis === void 0 ? void 0 : kpis.total_ligacoes) !== null && _c !== void 0 ? _c : 0, pior: (_d = kpis === null || kpis === void 0 ? void 0 : kpis.pior_item) !== null && _d !== void 0 ? _d : null }), (0, jsx_runtime_1.jsx)(TrendLineChart_1.default, { data: trend !== null && trend !== void 0 ? trend : [] }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full border", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "bg-gray-100", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2", children: "Agente" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2", children: "# Liga\u00E7\u00F5es" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2", children: "M\u00E9dia" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2", children: "Pior Item" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2", children: "Detalhar" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: agents === null || agents === void 0 ? void 0 : agents.map(function (agent, idx) {
                                var wi = worstItemQueries[idx];
                                var piorLabel = '—';
                                if (wi.isLoading)
                                    piorLabel = '…';
                                else if (wi.isError)
                                    piorLabel = 'Erro';
                                else if (wi.data && typeof wi.data === 'object' && 'categoria' in wi.data && 'taxa_nao_conforme' in wi.data) {
                                    var data = wi.data;
                                    piorLabel = "".concat((0, format_1.formatItemName)(data.categoria), " (").concat((data.taxa_nao_conforme * 100).toFixed(0), "%)");
                                }
                                return ((0, jsx_runtime_1.jsxs)("tr", { className: "even:bg-gray-50", children: [(0, jsx_runtime_1.jsx)("td", { className: "border px-4 py-2", children: (0, format_1.formatAgentName)(agent) }), (0, jsx_runtime_1.jsx)("td", { className: "border px-4 py-2", children: agent.ligacoes }), (0, jsx_runtime_1.jsx)("td", { className: "border px-4 py-2", children: agent.media.toFixed(1) }), (0, jsx_runtime_1.jsx)("td", { className: "border px-4 py-2", children: piorLabel }), (0, jsx_runtime_1.jsx)("td", { className: "border px-4 py-2", children: (0, jsx_runtime_1.jsx)(react_router_dom_1.Link, { to: "/agent/".concat(agent.agent_id), className: "bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700 transition-colors font-medium text-sm", children: "DETALHAR" }) })] }, agent.agent_id));
                            }) })] }) })] }));
};
exports.default = Dashboard;
