"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var recharts_1 = require("recharts");
var TrendLineChart = function (_a) {
    var data = _a.data;
    return ((0, jsx_runtime_1.jsx)("div", { className: "h-72 bg-white rounded-xl shadow p-4 mb-6", children: (0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.LineChart, { data: data, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3" }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "dia" }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { domain: [0, 100] }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, {}), (0, jsx_runtime_1.jsx)(recharts_1.Line, { type: "monotone", dataKey: "media", stroke: "#3b82f6", dot: false })] }) }) }));
};
exports.default = TrendLineChart;
