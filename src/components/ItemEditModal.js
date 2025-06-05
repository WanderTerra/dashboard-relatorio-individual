"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var react_query_1 = require("@tanstack/react-query");
var api_1 = require("../lib/api");
var format_1 = require("../lib/format");
var use_toast_1 = require("../hooks/use-toast");
var axios_1 = require("axios");
var ItemEditModal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, item = _a.item, avaliacaoId = _a.avaliacaoId;
    var _b = (0, react_1.useState)(item.resultado), selectedStatus = _b[0], setSelectedStatus = _b[1];
    var _c = (0, react_1.useState)(item.descricao), descricao = _c[0], setDescricao = _c[1];
    var originalStatus = (0, react_1.useState)(item.resultado)[0];
    var originalDescricao = (0, react_1.useState)(item.descricao)[0];
    var queryClient = (0, react_query_1.useQueryClient)();
    // Verificar se houve alterações
    var hasChanges = selectedStatus !== originalStatus || descricao !== originalDescricao;
    // Função para lidar com o fechamento do modal
    var handleClose = function () {
        if (hasChanges) {
            // Perguntar ao usuário se ele realmente deseja descartar as alterações
            if (window.confirm('Você tem alterações não salvas. Deseja realmente sair?')) {
                onClose(false);
            }
        }
        else {
            onClose(false);
        }
    };
    // Função para ser executada após uma atualização bem-sucedida
    var handleSuccess = function () {
        // Mostrar notificação de sucesso
        (0, use_toast_1.toast)({
            title: "Sucesso",
            description: "Item \"".concat((0, format_1.formatItemName)(item.categoria), "\" atualizado com sucesso!"),
            variant: "default",
        });
        // Invalidar queries para recarregar os dados
        queryClient.invalidateQueries({ queryKey: ['callItems', avaliacaoId] });
        // Invalidar potencialmente outras queries afetadas
        queryClient.invalidateQueries({ queryKey: ['kpis'] });
        queryClient.invalidateQueries({ queryKey: ['agents'] });
        queryClient.invalidateQueries({ queryKey: ['agentCalls'] });
        queryClient.invalidateQueries({ queryKey: ['agentSummary'] });
        queryClient.invalidateQueries({ queryKey: ['agentWorstItem'] });
        queryClient.invalidateQueries({ queryKey: ['trend'] });
        // Fechar o modal após o sucesso e indicar que o item foi editado
        onClose(true, item.categoria);
    };
    // Usar React Query para gerenciar a mutação de atualização
    var updateMutation = (0, react_query_1.useMutation)({
        mutationFn: function () {
            console.log('Atualizando item:', {
                avaliacaoId: avaliacaoId,
                categoria: item.categoria,
                resultado: selectedStatus,
                descricao: descricao
            });
            return (0, api_1.updateItem)(avaliacaoId, item.categoria, selectedStatus, descricao);
        },
        onSuccess: function () { return handleSuccess(); },
        onError: function (error) {
            // Determinar mensagem de erro baseada no tipo de erro
            var errorMessage = 'Erro desconhecido';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            // Verificar se é um erro do Axios com resposta do servidor
            if (axios_1.default.isAxiosError(error) && error.response) {
                // Extrair mensagem do servidor se disponível
                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
                else {
                    // Ou usar o código de status HTTP
                    errorMessage = "Erro ".concat(error.response.status, ": ").concat(error.response.statusText);
                }
            }
            // Mostrar notificação de erro
            (0, use_toast_1.toast)({
                title: "Erro",
                description: "Erro ao atualizar item: ".concat(errorMessage),
                variant: "destructive",
            });
        }
    });
    // Função para salvar as alterações
    var handleSave = function () {
        updateMutation.mutate();
    };
    // Opções de status disponíveis
    var statusOptions = [
        { id: 'CONFORME', label: 'Conforme', color: 'green' },
        { id: 'NAO CONFORME', label: 'Não Conforme', color: 'red' },
        { id: 'NAO SE APLICA', label: 'Não se Aplica', color: 'gray' }
    ];
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-in slide-in-from-bottom-5 zoom-in-95 duration-300", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-5", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-bold text-gray-800", children: "Editar Item" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleClose, className: "text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100", children: (0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) }) })] }), "        ", (0, jsx_runtime_1.jsx)("div", { className: "mb-5", children: (0, jsx_runtime_1.jsx)("div", { className: "inline-block px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-100 shadow-sm", children: (0, format_1.formatItemName)(item.categoria) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-medium mb-3 text-gray-700", children: "Status:" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 gap-3", children: ["            ", statusOptions.map(function (option) {
                                    // Determinar o estilo baseado na seleção
                                    var bgColor = selectedStatus === option.id
                                        ? option.id === 'CONFORME' ? 'bg-green-50 border-green-400 shadow-md shadow-green-100/50' :
                                            option.id === 'NAO CONFORME' ? 'bg-red-50 border-red-400 shadow-md shadow-red-100/50' :
                                                'bg-gray-50 border-gray-400 shadow-md shadow-gray-100/50'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100';
                                    // Determinar a cor do texto
                                    var textColor = option.id === 'CONFORME' ? 'text-green-700' :
                                        option.id === 'NAO CONFORME' ? 'text-red-700' :
                                            'text-gray-700';
                                    return ((0, jsx_runtime_1.jsxs)("label", { className: "flex items-center p-3.5 rounded-lg border cursor-pointer transition-all ".concat(bgColor), children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", name: "status", value: option.id, checked: selectedStatus === option.id, onChange: function () { return setSelectedStatus(option.id); }, className: "h-4 w-4 text-blue-600 hidden" }), (0, jsx_runtime_1.jsx)("div", { className: "w-5 h-5 rounded-full mr-3 flex items-center justify-center border ".concat(selectedStatus === option.id
                                                    ? option.id === 'CONFORME' ? 'border-green-500 bg-green-500' :
                                                        option.id === 'NAO CONFORME' ? 'border-red-500 bg-red-500' :
                                                            'border-gray-500 bg-gray-500'
                                                    : 'border-gray-300'), children: selectedStatus === option.id && ((0, jsx_runtime_1.jsx)("div", { className: "w-2 h-2 rounded-full bg-white animate-pulse" })) }), (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium ".concat(textColor), children: option.label }) })] }, option.id));
                                })] })] }), "        ", (0, jsx_runtime_1.jsxs)("div", { className: "mb-5", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Descri\u00E7\u00E3o:" }), (0, jsx_runtime_1.jsx)("textarea", { value: descricao, onChange: function (e) { return setDescricao(e.target.value); }, className: "w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none h-24 transition-all shadow-sm", placeholder: "Digite a descri\u00E7\u00E3o do item" })] }), "        ", (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end space-x-3", children: [(0, jsx_runtime_1.jsx)("button", { onClick: handleClose, className: "px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-sm hover:shadow", children: "Cancelar" }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleSave, disabled: updateMutation.isPending || !hasChanges, className: "px-5 py-2 text-sm font-medium rounded-lg text-white transition-all ".concat(hasChanges ? 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow' : 'bg-gray-400', " disabled:opacity-70 flex items-center"), children: [updateMutation.isPending && ((0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] })), updateMutation.isPending ? 'Salvando...' : 'Salvar'] })] }), updateMutation.isError && ((0, jsx_runtime_1.jsx)("div", { className: "mt-4 p-3.5 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-3 duration-300", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 mr-2 text-red-500", viewBox: "0 0 20 20", fill: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z", clipRule: "evenodd" }) }), "Erro ao atualizar item. Por favor, tente novamente ou contate o suporte."] }) }))] }) }));
};
exports.default = ItemEditModal;
