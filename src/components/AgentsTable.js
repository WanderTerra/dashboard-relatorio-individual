"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_router_dom_1 = require("react-router-dom");
var format_1 = require("../lib/format");
var cor = function (v) { return (v < 50 ? 'text-red-600' : v < 70 ? 'text-yellow-600' : 'text-green-600'); };
var AgentsTable = function (_a) {
    var agents = _a.agents, filters = _a.filters;
    var navigate = (0, react_router_dom_1.useNavigate)();
    return ((0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto bg-white shadow rounded-xl", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full text-sm", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "bg-gray-100 text-left", children: [(0, jsx_runtime_1.jsx)("th", { className: "p-3", children: "Nome" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3", children: "ID" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3", children: "Pontua\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3", children: "Liga\u00E7\u00F5es" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3", children: "Item com maior NC" }), (0, jsx_runtime_1.jsx)("th", { className: "p-3" })] }) }), (0, jsx_runtime_1.jsxs)("tbody", { children: ["          ", agents.map(function (a) { return ((0, jsx_runtime_1.jsxs)("tr", { className: "border-b last:border-none", children: [(0, jsx_runtime_1.jsx)("td", { className: "p-3", children: (0, format_1.formatAgentName)(a) }), (0, jsx_runtime_1.jsx)("td", { className: "p-3", children: a.agent_id }), (0, jsx_runtime_1.jsx)("td", { className: "p-3 font-semibold ".concat(cor(a.media)), children: a.media }), (0, jsx_runtime_1.jsx)("td", { className: "p-3", children: a.ligacoes }), (0, jsx_runtime_1.jsx)("td", { className: "p-3", children: (0, jsx_runtime_1.jsx)("button", { className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors", onClick: function () { return navigate("/agent/".concat(a.agent_id), { state: filters }); }, children: "DETALHAR" }) })] }, a.agent_id)); })] })] }) }));
};
exports.default = AgentsTable;
