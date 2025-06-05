"use client";
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
exports.toggleVariants = exports.Toggle = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var React = require("react");
var TogglePrimitive = require("@radix-ui/react-toggle");
var class_variance_authority_1 = require("class-variance-authority");
var utils_1 = require("@/lib/utils");
var toggleVariants = (0, class_variance_authority_1.cva)("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-zinc-100 hover:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-zinc-100 data-[state=on]:text-zinc-900 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:hover:bg-zinc-800 dark:hover:text-zinc-400 dark:focus-visible:ring-zinc-300 dark:data-[state=on]:bg-zinc-800 dark:data-[state=on]:text-zinc-50", {
    variants: {
        variant: {
            default: "bg-transparent",
            outline: "border border-zinc-200 bg-transparent shadow-sm hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        },
        size: {
            default: "h-9 px-2 min-w-9",
            sm: "h-8 px-1.5 min-w-8",
            lg: "h-10 px-2.5 min-w-10",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
exports.toggleVariants = toggleVariants;
var Toggle = React.forwardRef(function (_a, ref) {
    var className = _a.className, variant = _a.variant, size = _a.size, props = __rest(_a, ["className", "variant", "size"]);
    return ((0, jsx_runtime_1.jsx)(TogglePrimitive.Root, __assign({ ref: ref, className: (0, utils_1.cn)(toggleVariants({ variant: variant, size: size, className: className })) }, props)));
});
exports.Toggle = Toggle;
Toggle.displayName = TogglePrimitive.Root.displayName;
