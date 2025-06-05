"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var KpiCard_1 = require("./KpiCard");
var format_1 = require("../lib/format");
var cor = function (v) {
    return v == null ? '' : v < 50 ? 'text-red-600' : v < 70 ? 'text-yellow-600' : 'text-green-600';
};
var KpiCards = function (_a) {
    var media = _a.media, total = _a.total, pior = _a.pior;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4 md:grid-cols-3 mb-6", children: [(0, jsx_runtime_1.jsx)(KpiCard_1.default, { label: "Pontua\u00E7\u00E3o m\u00E9dia", value: media, color: cor(media) }), (0, jsx_runtime_1.jsx)(KpiCard_1.default, { label: "Liga\u00E7\u00F5es avaliadas", value: total }), (0, jsx_runtime_1.jsx)(KpiCard_1.default, { label: "Item com maior NC", value: pior ? "".concat((0, format_1.formatItemName)(pior.categoria), " (").concat(pior.pct_nao_conforme, "%)") : '-', color: "text-red-600" })] }));
};
exports.default = KpiCards;
