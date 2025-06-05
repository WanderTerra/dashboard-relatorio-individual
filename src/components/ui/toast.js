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
exports.ToastAction = exports.ToastClose = exports.ToastDescription = exports.ToastTitle = exports.Toast = exports.ToastViewport = exports.ToastProvider = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var React = require("react");
var ToastPrimitives = require("@radix-ui/react-toast");
var class_variance_authority_1 = require("class-variance-authority");
var lucide_react_1 = require("lucide-react");
var utils_1 = require("@/lib/utils");
var ToastProvider = ToastPrimitives.Provider;
exports.ToastProvider = ToastProvider;
var ToastViewport = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(ToastPrimitives.Viewport, __assign({ ref: ref, className: (0, utils_1.cn)("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", className) }, props)));
});
exports.ToastViewport = ToastViewport;
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
var toastVariants = (0, class_variance_authority_1.cva)("group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border border-zinc-200 p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full dark:border-zinc-800", {
    variants: {
        variant: {
            default: "border bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50",
            destructive: "destructive group border-red-500 bg-red-500 text-zinc-50 dark:border-red-900 dark:bg-red-900 dark:text-zinc-50",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});
var Toast = React.forwardRef(function (_a, ref) {
    var className = _a.className, variant = _a.variant, props = __rest(_a, ["className", "variant"]);
    return ((0, jsx_runtime_1.jsx)(ToastPrimitives.Root, __assign({ ref: ref, className: (0, utils_1.cn)(toastVariants({ variant: variant }), className) }, props)));
});
exports.Toast = Toast;
Toast.displayName = ToastPrimitives.Root.displayName;
var ToastAction = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(ToastPrimitives.Action, __assign({ ref: ref, className: (0, utils_1.cn)("inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-transparent px-3 text-sm font-medium transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-zinc-100/40 group-[.destructive]:hover:border-red-500/30 group-[.destructive]:hover:bg-red-500 group-[.destructive]:hover:text-zinc-50 group-[.destructive]:focus:ring-red-500 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:focus:ring-zinc-300 dark:group-[.destructive]:border-zinc-800/40 dark:group-[.destructive]:hover:border-red-900/30 dark:group-[.destructive]:hover:bg-red-900 dark:group-[.destructive]:hover:text-zinc-50 dark:group-[.destructive]:focus:ring-red-900", className) }, props)));
});
exports.ToastAction = ToastAction;
ToastAction.displayName = ToastPrimitives.Action.displayName;
var ToastClose = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(ToastPrimitives.Close, __assign({ ref: ref, className: (0, utils_1.cn)("absolute right-1 top-1 rounded-md p-1 text-zinc-950/50 opacity-0 transition-opacity hover:text-zinc-950 focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 dark:text-zinc-50/50 dark:hover:text-zinc-50", className), "toast-close": "" }, props, { children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-4 w-4" }) })));
});
exports.ToastClose = ToastClose;
ToastClose.displayName = ToastPrimitives.Close.displayName;
var ToastTitle = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(ToastPrimitives.Title, __assign({ ref: ref, className: (0, utils_1.cn)("text-sm font-semibold [&+div]:text-xs", className) }, props)));
});
exports.ToastTitle = ToastTitle;
ToastTitle.displayName = ToastPrimitives.Title.displayName;
var ToastDescription = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(ToastPrimitives.Description, __assign({ ref: ref, className: (0, utils_1.cn)("text-sm opacity-90", className) }, props)));
});
exports.ToastDescription = ToastDescription;
ToastDescription.displayName = ToastPrimitives.Description.displayName;
