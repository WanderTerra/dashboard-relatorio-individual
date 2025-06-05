"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Slider = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var React = require("react");
var SliderPrimitive = require("@radix-ui/react-slider");
var utils_1 = require("@/lib/utils");
var Slider = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsxs)(SliderPrimitive.Root, __assign({ ref: ref, className: (0, utils_1.cn)("relative flex w-full touch-none select-none items-center", className) }, props, { children: [(0, jsx_runtime_1.jsx)(SliderPrimitive.Track, { className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-zinc-900/20 dark:bg-zinc-50/20", children: (0, jsx_runtime_1.jsx)(SliderPrimitive.Range, { className: "absolute h-full bg-zinc-900 dark:bg-zinc-50" }) }), (0, jsx_runtime_1.jsx)(SliderPrimitive.Thumb, { className: "block h-4 w-4 rounded-full border border-zinc-200 border-zinc-900/50 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-800 dark:border-zinc-50/50 dark:bg-zinc-950 dark:focus-visible:ring-zinc-300" })] })));
});
exports.Slider = Slider;
Slider.displayName = SliderPrimitive.Root.displayName;
