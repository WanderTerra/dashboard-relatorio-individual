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
exports.AlertDescription = exports.AlertTitle = exports.Alert = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var React = require("react");
var class_variance_authority_1 = require("class-variance-authority");
var utils_1 = require("@/lib/utils");
var alertVariants = (0, class_variance_authority_1.cva)("relative w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-zinc-950 [&>svg~*]:pl-7 dark:border-zinc-800 dark:[&>svg]:text-zinc-50", {
    variants: {
        variant: {
            default: "bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50",
            destructive: "border-red-500/50 text-red-500 dark:border-red-500 [&>svg]:text-red-500 dark:border-red-900/50 dark:text-red-900 dark:dark:border-red-900 dark:[&>svg]:text-red-900",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});
var Alert = React.forwardRef(function (_a, ref) {
    var className = _a.className, variant = _a.variant, props = __rest(_a, ["className", "variant"]);
    return ((0, jsx_runtime_1.jsx)("div", __assign({ ref: ref, role: "alert", className: (0, utils_1.cn)(alertVariants({ variant: variant }), className) }, props)));
});
exports.Alert = Alert;
Alert.displayName = "Alert";
var AlertTitle = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("h5", __assign({ ref: ref, className: (0, utils_1.cn)("mb-1 font-medium leading-none tracking-tight", className) }, props)));
});
exports.AlertTitle = AlertTitle;
AlertTitle.displayName = "AlertTitle";
var AlertDescription = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("div", __assign({ ref: ref, className: (0, utils_1.cn)("text-sm [&_p]:leading-relaxed", className) }, props)));
});
exports.AlertDescription = AlertDescription;
AlertDescription.displayName = "AlertDescription";
