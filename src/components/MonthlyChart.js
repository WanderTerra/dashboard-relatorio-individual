"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var recharts_1 = require("recharts");
var MonthlyChart = function (_a) {
    var data = _a.data;
    return ((0, jsx_runtime_1.jsx)(recharts_1.ResponsiveContainer, { width: "100%", height: "100%", children: (0, jsx_runtime_1.jsxs)(recharts_1.LineChart, { data: data, margin: {
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
            }, children: [(0, jsx_runtime_1.jsx)(recharts_1.CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }), (0, jsx_runtime_1.jsx)(recharts_1.XAxis, { dataKey: "name", tick: { fill: '#6b7280' }, axisLine: { stroke: '#e5e7eb' } }), (0, jsx_runtime_1.jsx)(recharts_1.YAxis, { domain: [0, 100], tick: { fill: '#6b7280' }, axisLine: { stroke: '#e5e7eb' }, tickFormatter: function (value) { return "".concat(value, "pts"); } }), (0, jsx_runtime_1.jsx)(recharts_1.Tooltip, { formatter: function (value) { return ["".concat(value, " pts"), 'Pontuação']; }, labelFormatter: function (label) { return "M\u00EAs: ".concat(label); }, contentStyle: {
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    } }), (0, jsx_runtime_1.jsx)(recharts_1.Line, { type: "monotone", dataKey: "score", stroke: "#4f46e5", strokeWidth: 3, dot: {
                        fill: '#4f46e5',
                        r: 6,
                        strokeWidth: 2,
                        stroke: '#fff'
                    }, activeDot: {
                        r: 8,
                        stroke: '#4f46e5',
                        strokeWidth: 2,
                        fill: '#fff'
                    } })] }) }));
};
exports.default = MonthlyChart;
