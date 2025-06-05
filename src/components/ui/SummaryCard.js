"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var SummaryCard = function (_a) {
    var title = _a.title, subtitle = _a.subtitle, media = _a.media, total = _a.total, name = _a.name;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white p-4 rounded shadow", children: [name && (0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-bold mb-1", children: name }), (0, jsx_runtime_1.jsx)("h2", { className: "".concat(name ? 'text-lg' : 'text-xl font-bold'), children: title }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600", children: subtitle }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-4 flex space-x-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "M\u00E9dia geral" }), (0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-semibold", children: media.toFixed(1) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "Total de liga\u00E7\u00F5es" }), (0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-semibold", children: total })] })] })] }));
};
exports.default = SummaryCard;
