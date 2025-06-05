"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateItem = exports.downloadAudio = exports.getAgentWorstItem = exports.getTranscription = exports.getCallItems = exports.getAgentCalls = exports.getAgentSummary = exports.getAgents = exports.getTrend = exports.getKpis = exports.api = exports.baseURL = void 0;
var axios_1 = require("axios");
//
// baseURL vazio: tudo já vai no proxy do Vite em /api/…
//
exports.baseURL = '/api';
// Exporting the api instance to be used consistently across all files
exports.api = axios_1.default.create({
    baseURL: exports.baseURL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});
// DEBUG: log de todas as requests/responses
exports.api.interceptors.request.use(function (request) {
    console.log('→ API Request:', request.method, request.url, request.params || request.data);
    return request;
});
exports.api.interceptors.response.use(function (response) {
    console.log('← API Response:', response.status, response.data);
    return response;
}, function (error) {
    var _a, _b;
    console.error('× API Error:', (_a = error.response) === null || _a === void 0 ? void 0 : _a.status, (_b = error.response) === null || _b === void 0 ? void 0 : _b.data);
    return Promise.reject(error);
});
var getKpis = function (f) { return exports.api.get('/kpis', { params: f }).then(function (r) { return r.data; }); };
exports.getKpis = getKpis;
var getTrend = function (f) { return exports.api.get('/trend', { params: f }).then(function (r) { return r.data; }); };
exports.getTrend = getTrend;
var getAgents = function (f) { return exports.api.get('/agents', { params: f }).then(function (r) { return r.data; }); };
exports.getAgents = getAgents;
var getAgentSummary = function (id, f) { return exports.api.get("/agent/".concat(id, "/summary"), { params: f }).then(function (r) { return r.data; }); };
exports.getAgentSummary = getAgentSummary;
var getAgentCalls = function (id, f) { return exports.api.get("/agent/".concat(id, "/calls"), { params: f }).then(function (r) { return r.data; }); };
exports.getAgentCalls = getAgentCalls;
var getCallItems = function (avaliacaoId) { return exports.api.get("/call/".concat(avaliacaoId, "/items")).then(function (r) { return r.data; }); };
exports.getCallItems = getCallItems;
var getTranscription = function (avaliacaoId) { return exports.api.get("/call/".concat(avaliacaoId, "/transcription")).then(function (r) { return r.data; }); };
exports.getTranscription = getTranscription;
var getAgentWorstItem = function (id, f) { return exports.api.get("/agent/".concat(id, "/worst_item"), { params: f }).then(function (r) { return r.data; }); };
exports.getAgentWorstItem = getAgentWorstItem;
var downloadAudio = function (callId) { return exports.api.get("/call/".concat(callId, "/audio"), { responseType: 'blob' }).then(function (r) { return r.data; }); };
exports.downloadAudio = downloadAudio;
// Função para atualizar um item de avaliação
var updateItem = function (avaliacaoId, categoria, resultado, descricao) {
    return exports.api.put("/call/".concat(avaliacaoId, "/item/").concat(encodeURIComponent(categoria)), {
        categoria: categoria,
        resultado: resultado,
        descricao: descricao
    }).then(function (r) { return r.data; });
};
exports.updateItem = updateItem;
