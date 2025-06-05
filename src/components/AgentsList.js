"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_router_dom_1 = require("react-router-dom");
var format_1 = require("../lib/format");
var AgentsList = function (_a) {
    var agents = _a.agents;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var getStatusColor = function (status) {
        switch (status) {
            case 'Não Conforme':
                return 'bg-red-100 text-red-800';
            case 'Atenção':
                return 'bg-yellow-100 text-yellow-800';
            case 'Conforme':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    var handleViewReport = function (agentId) {
        navigate("/agent/".concat(agentId));
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full divide-y divide-gray-200", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-gray-50", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Agente" }), (0, jsx_runtime_1.jsx)("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Pontua\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Liga\u00E7\u00F5es Avaliadas" }), (0, jsx_runtime_1.jsx)("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), (0, jsx_runtime_1.jsx)("th", { scope: "col", className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "A\u00E7\u00E3o" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "bg-white divide-y divide-gray-200", children: agents.map(function (agent) { return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 whitespace-nowrap", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-indigo-700 font-medium", children: agent.name.split(' ').map(function (n) { return n[0]; }).join('') }) }), (0, jsx_runtime_1.jsx)("div", { className: "ml-4", children: (0, jsx_runtime_1.jsx)("div", { className: "text-sm font-medium text-gray-900", children: (0, format_1.formatAgentName)(agent) }) })] }) }), (0, jsx_runtime_1.jsxs)("td", { className: "px-6 py-4 whitespace-nowrap", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-sm text-gray-900 font-semibold", children: [agent.score, " pts"] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full bg-gray-200 rounded-full h-2.5 mt-2", children: (0, jsx_runtime_1.jsx)("div", { className: "h-2.5 rounded-full ".concat(agent.score < 60 ? 'bg-red-600' :
                                                agent.score < 70 ? 'bg-yellow-500' : 'bg-green-600'), style: { width: "".concat(agent.score, "%") } }) })] }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 whitespace-nowrap", children: (0, jsx_runtime_1.jsx)("div", { className: "text-sm text-gray-900", children: agent.calls }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 whitespace-nowrap", children: (0, jsx_runtime_1.jsx)("span", { className: "px-2 inline-flex text-xs leading-5 font-semibold rounded-full ".concat(getStatusColor(agent.status)), children: agent.status }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: (0, jsx_runtime_1.jsx)("button", { className: "text-indigo-600 hover:text-indigo-900 font-medium", onClick: function () { return handleViewReport(agent.id); }, children: "Ver" }) })] }, agent.id)); }) })] }) }));
};
exports.default = AgentsList;
