"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var react_query_1 = require("@tanstack/react-query");
var api_1 = require("../lib/api");
var TranscriptionModal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, avaliacaoId = _a.avaliacaoId, callId = _a.callId;
    var _b = (0, react_1.useState)(false), isDownloading = _b[0], setIsDownloading = _b[1];
    var _c = (0, react_1.useState)(null), downloadError = _c[0], setDownloadError = _c[1];
    // Buscar a transcrição
    var _d = (0, react_query_1.useQuery)({
        queryKey: ['transcription', avaliacaoId],
        queryFn: function () { return (0, api_1.getTranscription)(avaliacaoId); },
        enabled: isOpen // Só buscar quando o modal estiver aberto
    }), data = _d.data, isLoading = _d.isLoading, error = _d.error;
    var handleDownloadClick = function (event) { return __awaiter(void 0, void 0, void 0, function () {
        var audioBlob, url, link, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    if (!callId) {
                        setDownloadError('ID da ligação não encontrado');
                        return [2 /*return*/];
                    }
                    setIsDownloading(true);
                    setDownloadError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, api_1.downloadAudio)(callId)];
                case 2:
                    audioBlob = _a.sent();
                    url = window.URL.createObjectURL(new Blob([audioBlob]));
                    link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', "audio-".concat(callId, ".mp3"));
                    document.body.appendChild(link);
                    link.click();
                    // Limpar recursos
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(link);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Erro ao baixar áudio:', error_1);
                    setDownloadError('Falha ao baixar o áudio. Tente novamente mais tarde.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsDownloading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 animate-in fade-in", onClick: onClose }), (0, jsx_runtime_1.jsxs)("div", { className: "fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col h-full bg-white shadow-xl transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-4 border-b", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-bold text-gray-800", children: "Transcri\u00E7\u00E3o da Liga\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: "p-2 rounded-full hover:bg-gray-100 transition-colors", children: (0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 text-gray-500", viewBox: "0 0 20 20", fill: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 overflow-y-auto p-4", children: isLoading ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex justify-center items-center h-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" }), (0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-10 w-10 border-2 border-blue-300 border-t-transparent absolute top-0 left-0", style: { animationDirection: 'reverse', animationDuration: '1.5s' } })] }), (0, jsx_runtime_1.jsx)("span", { className: "ml-4 text-sm font-medium text-gray-600", children: "Carregando transcri\u00E7\u00E3o..." })] })) : error ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center h-full text-gray-500", children: [(0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-12 w-12 text-gray-400 mb-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-medium", children: "Erro ao carregar transcri\u00E7\u00E3o" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm mt-2", children: "N\u00E3o foi poss\u00EDvel carregar a transcri\u00E7\u00E3o desta liga\u00E7\u00E3o." })] })) : data ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [callId && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-600 mb-1", children: ["ID da Liga\u00E7\u00E3o: ", (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: callId })] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-600", children: ["ID da Avalia\u00E7\u00E3o: ", (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: avaliacaoId })] })] }), (0, jsx_runtime_1.jsx)("button", { className: "inline-flex items-center rounded-lg px-4 py-2 text-white font-medium shadow transition-all ".concat(isDownloading ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'), onClick: handleDownloadClick, disabled: isDownloading, children: isDownloading ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Baixando..."] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 mr-2", viewBox: "0 0 20 20", fill: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z", clipRule: "evenodd" }) }), "Baixar \u00C1udio"] })) })] })), downloadError && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-3.5 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-3 duration-300", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 mr-2 text-red-500", viewBox: "0 0 20 20", fill: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }), downloadError] }) })), (0, jsx_runtime_1.jsx)("div", { className: "bg-gray-50 rounded-xl p-5 text-gray-800 whitespace-pre-wrap shadow-inner border border-gray-200 leading-relaxed", children: data.conteudo || 'Sem transcrição disponível.' })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center h-full text-gray-500", children: [(0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-12 w-12 text-gray-400 mb-3", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-medium", children: "Transcri\u00E7\u00E3o n\u00E3o encontrada" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm mt-2", children: "N\u00E3o foi poss\u00EDvel localizar a transcri\u00E7\u00E3o desta liga\u00E7\u00E3o." })] })) }), (0, jsx_runtime_1.jsx)("div", { className: "border-t p-4", children: (0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: "w-full flex justify-center items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors", children: "Fechar" }) })] })] }));
};
exports.default = TranscriptionModal;
