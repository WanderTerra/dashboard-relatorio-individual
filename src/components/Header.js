"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var Header = function () {
    return ((0, jsx_runtime_1.jsx)("header", { className: "bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg", children: (0, jsx_runtime_1.jsx)("div", { className: "container mx-auto px-4 py-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col md:flex-row justify-between items-center", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl md:text-3xl font-bold", children: "Dashboard de Avalia\u00E7\u00E3o de Liga\u00E7\u00F5es" }), (0, jsx_runtime_1.jsx)("p", { className: "text-blue-100 mt-1", children: "Monitoramento de desempenho e qualidade" })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-4 md:mt-0 flex items-center", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-blue-600 rounded-lg px-4 py-2 flex items-center", children: [(0, jsx_runtime_1.jsx)("span", { className: "mr-2", children: "Data:" }), (0, jsx_runtime_1.jsx)("span", { className: "font-semibold", children: new Date().toLocaleDateString('pt-BR') })] }) })] }) }) }));
};
exports.default = Header;
