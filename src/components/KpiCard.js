"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var intentStyle = {
    success: 'bg-green-50 text-green-600 ring-green-300',
    warning: 'bg-yellow-50 text-yellow-700 ring-yellow-300',
    danger: 'bg-red-50 text-red-600 ring-red-300',
};
var KpiCard = function (_a) {
    var label = _a.label, value = _a.value, _b = _a.intent, intent = _b === void 0 ? 'success' : _b;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col gap-1 rounded-xl p-4 shadow-sm ring-1 ".concat(intentStyle[intent]), children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs/relaxed font-medium uppercase tracking-wide", children: label }), (0, jsx_runtime_1.jsx)("span", { className: "text-3xl font-extrabold leading-none", children: value !== null && value !== void 0 ? value : '-' })] }));
};
exports.default = KpiCard;
