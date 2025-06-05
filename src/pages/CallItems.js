"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CallItems;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var react_query_1 = require("@tanstack/react-query");
var api_1 = require("../lib/api");
var format_1 = require("../lib/format");
var ItemEditModal_1 = require("../components/ItemEditModal");
var TranscriptionModal_1 = require("../components/TranscriptionModal");
var cor = function (r) {
    return r === 'CONFORME' ? 'text-green-600'
        : r === 'NAO SE APLICA' ? 'text-gray-600'
            : 'text-red-600';
};
function CallItems() {
    var _a;
    var avaliacaoId = (0, react_router_dom_1.useParams)().avaliacaoId;
    var location = (0, react_router_dom_1.useLocation)();
    var agentId = (_a = location.state) === null || _a === void 0 ? void 0 : _a.agentId;
    // Estado para controlar o modal de edição
    var _b = (0, react_1.useState)(null), selectedItem = _b[0], setSelectedItem = _b[1];
    var _c = (0, react_1.useState)(false), isModalOpen = _c[0], setIsModalOpen = _c[1];
    var _d = (0, react_1.useState)(new Set()), editedItems = _d[0], setEditedItems = _d[1];
    var _e = (0, react_1.useState)(false), isTranscriptionModalOpen = _e[0], setIsTranscriptionModalOpen = _e[1];
    var _f = (0, react_1.useState)(undefined), callId = _f[0], setCallId = _f[1];
    var _g = (0, react_query_1.useQuery)({
        queryKey: ['callItems', avaliacaoId],
        queryFn: function () { return (0, api_1.getCallItems)(avaliacaoId); },
    }), _h = _g.data, data = _h === void 0 ? [] : _h, isLoading = _g.isLoading;
    // Buscar informações da ligação para obter o call_id
    var calls = (0, react_query_1.useQuery)({
        queryKey: ['calls', agentId, avaliacaoId],
        queryFn: function () { return (0, api_1.getAgentCalls)(agentId, {
            start: '2024-01-01',
            end: '2025-12-31'
        }); },
        enabled: !!agentId
    }).data;
    // Effect para definir o callId quando os dados estiverem disponíveis
    (0, react_1.useEffect)(function () {
        if (calls) {
            var callInfo = calls.find(function (c) { return String(c.avaliacao_id) === String(avaliacaoId); });
            if (callInfo) {
                setCallId(callInfo.call_id);
            }
        }
    }, [calls, avaliacaoId]);
    // Abrir modal de edição para um item específico
    var handleEditItem = function (item) {
        setSelectedItem(item);
        setIsModalOpen(true);
    };
    // Fechar o modal de edição
    var handleCloseModal = function (itemEdited, categoria) {
        if (itemEdited === void 0) { itemEdited = false; }
        if (itemEdited && categoria) {
            // Adicionar o item à lista de itens editados
            setEditedItems(function (prev) {
                var newSet = new Set(prev);
                newSet.add(categoria);
                return newSet;
            });
        }
        setIsModalOpen(false);
        setSelectedItem(null);
    };
    // Gerenciar o clique no botão de transcrição
    var handleTranscriptionClick = function () {
        setIsTranscriptionModalOpen(true);
    };
    // Fechar o modal de transcrição
    var handleCloseTranscriptionModal = function () {
        setIsTranscriptionModalOpen(false);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "mx-auto transition-all duration-300 ".concat(isTranscriptionModalOpen ? 'max-w-md mr-xl pl-4' : 'max-w-4xl', " space-y-6 p-4 md:p-6"), children: [(0, jsx_runtime_1.jsxs)(react_router_dom_1.Link, { to: -1, className: "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 shadow-sm hover:bg-blue-700 transition-colors duration-200", children: [(0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 mr-2", viewBox: "0 0 20 20", fill: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z", clipRule: "evenodd" }) }), "Voltar"] }), "      ", (0, jsx_runtime_1.jsxs)("h2", { className: "text-xl font-bold text-gray-800 mt-4 flex items-center", children: ["Itens da liga\u00E7\u00E3o ", avaliacaoId, isTranscriptionModalOpen && ((0, jsx_runtime_1.jsx)("span", { className: "ml-3 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium animate-pulse", children: "Comparando com transcri\u00E7\u00E3o..." }))] }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleTranscriptionClick, className: "inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 mb-6 text-sm font-semibold text-white hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow group", children: [(0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 mr-2 group-hover:scale-110 transition-transform", viewBox: "0 0 20 20", fill: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z", clipRule: "evenodd" }) }), (0, jsx_runtime_1.jsx)("span", { className: "group-hover:translate-x-0.5 transition-transform", children: "Ver Transcri\u00E7\u00E3o" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-100 hover:shadow-md transition-all duration-200", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-medium text-gray-700", children: "Status dos itens:" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full bg-green-500 mr-2 shadow-sm shadow-green-200" }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-medium text-gray-600", children: "Conforme" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full bg-red-500 mr-2 shadow-sm shadow-red-200" }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-medium text-gray-600", children: "N\u00E3o Conforme" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full bg-gray-400 mr-2 shadow-sm shadow-gray-200" }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-medium text-gray-600", children: "N\u00E3o se Aplica" })] })] })] }), "      ", isLoading ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex justify-center items-center py-12", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" }), (0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-10 w-10 border-2 border-blue-300 border-t-transparent absolute top-0 left-0", style: { animationDirection: 'reverse', animationDuration: '1.5s' } })] }), (0, jsx_runtime_1.jsx)("span", { className: "ml-4 text-sm font-medium text-gray-600", children: "Carregando itens..." })] })) : ((0, jsx_runtime_1.jsx)("ul", { className: "space-y-4", children: data.map(function (it, idx) { return ((0, jsx_runtime_1.jsx)("li", { className: "rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 ".concat(editedItems.has(it.categoria) ? 'border-l-4 border-blue-500' : 'border border-gray-100'), children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center mb-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-2.5 h-2.5 rounded-full mr-2 ".concat(it.resultado === 'CONFORME' ? 'bg-green-500 shadow-sm shadow-green-200' :
                                                    it.resultado === 'NAO CONFORME' ? 'bg-red-500 shadow-sm shadow-red-200' : 'bg-gray-400 shadow-sm shadow-gray-200') }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-semibold text-gray-800", children: (0, format_1.formatItemName)(it.categoria) })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-xs text-gray-600 mb-2 leading-relaxed", children: it.descricao }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center ".concat(it.resultado === 'CONFORME' ? 'bg-green-100 text-green-700' :
                                            it.resultado === 'NAO CONFORME' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'), children: (0, format_1.formatItemName)(it.resultado) })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: function () { return handleEditItem(it); }, className: "ml-2 flex items-center text-xs px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition-all duration-200 font-medium shadow-sm hover:shadow-md group", children: [(0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform", viewBox: "0 0 20 20", fill: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { d: "M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" }) }), (0, jsx_runtime_1.jsx)("span", { className: "group-hover:translate-x-0.5 transition-transform", children: "Editar" })] })] }) }, idx)); }) })), selectedItem && ((0, jsx_runtime_1.jsx)(ItemEditModal_1.default, { isOpen: isModalOpen, onClose: handleCloseModal, item: selectedItem, avaliacaoId: avaliacaoId })), (0, jsx_runtime_1.jsx)(TranscriptionModal_1.default, { isOpen: isTranscriptionModalOpen, onClose: handleCloseTranscriptionModal, avaliacaoId: avaliacaoId, callId: callId })] }));
}
