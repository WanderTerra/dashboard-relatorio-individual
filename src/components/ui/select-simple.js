"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Combobox = Combobox;
var jsx_runtime_1 = require("react/jsx-runtime");
var utils_1 = require("../../lib/utils");
function Combobox(_a) {
    var options = _a.options, value = _a.value, onChange = _a.onChange, _b = _a.placeholder, placeholder = _b === void 0 ? "Selecionar..." : _b, _c = _a.emptyMessage, emptyMessage = _c === void 0 ? "Não encontrado." : _c, className = _a.className;
    return ((0, jsx_runtime_1.jsxs)("select", { className: (0, utils_1.cn)("w-full h-9 rounded border border-zinc-200 text-sm bg-white px-3 py-2", className), value: value, onChange: function (e) { return onChange(e.target.value); }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: placeholder }), options.map(function (option) { return ((0, jsx_runtime_1.jsx)("option", { value: option.value, children: option.label }, option.value)); })] }));
}
