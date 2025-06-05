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
exports.BreadcrumbEllipsis = exports.BreadcrumbSeparator = exports.BreadcrumbPage = exports.BreadcrumbLink = exports.BreadcrumbItem = exports.BreadcrumbList = exports.Breadcrumb = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var React = require("react");
var react_slot_1 = require("@radix-ui/react-slot");
var lucide_react_1 = require("lucide-react");
var utils_1 = require("@/lib/utils");
var Breadcrumb = React.forwardRef(function (_a, ref) {
    var props = __rest(_a, []);
    return (0, jsx_runtime_1.jsx)("nav", __assign({ ref: ref, "aria-label": "breadcrumb" }, props));
});
exports.Breadcrumb = Breadcrumb;
Breadcrumb.displayName = "Breadcrumb";
var BreadcrumbList = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("ol", __assign({ ref: ref, className: (0, utils_1.cn)("flex flex-wrap items-center gap-1.5 break-words text-sm text-zinc-500 sm:gap-2.5 dark:text-zinc-400", className) }, props)));
});
exports.BreadcrumbList = BreadcrumbList;
BreadcrumbList.displayName = "BreadcrumbList";
var BreadcrumbItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("li", __assign({ ref: ref, className: (0, utils_1.cn)("inline-flex items-center gap-1.5", className) }, props)));
});
exports.BreadcrumbItem = BreadcrumbItem;
BreadcrumbItem.displayName = "BreadcrumbItem";
var BreadcrumbLink = React.forwardRef(function (_a, ref) {
    var asChild = _a.asChild, className = _a.className, props = __rest(_a, ["asChild", "className"]);
    var Comp = asChild ? react_slot_1.Slot : "a";
    return ((0, jsx_runtime_1.jsx)(Comp, __assign({ ref: ref, className: (0, utils_1.cn)("transition-colors hover:text-zinc-950 dark:hover:text-zinc-50", className) }, props)));
});
exports.BreadcrumbLink = BreadcrumbLink;
BreadcrumbLink.displayName = "BreadcrumbLink";
var BreadcrumbPage = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("span", __assign({ ref: ref, role: "link", "aria-disabled": "true", "aria-current": "page", className: (0, utils_1.cn)("font-normal text-zinc-950 dark:text-zinc-50", className) }, props)));
});
exports.BreadcrumbPage = BreadcrumbPage;
BreadcrumbPage.displayName = "BreadcrumbPage";
var BreadcrumbSeparator = function (_a) {
    var children = _a.children, className = _a.className, props = __rest(_a, ["children", "className"]);
    return ((0, jsx_runtime_1.jsx)("li", __assign({ role: "presentation", "aria-hidden": "true", className: (0, utils_1.cn)("[&>svg]:w-3.5 [&>svg]:h-3.5", className) }, props, { children: children !== null && children !== void 0 ? children : (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, {}) })));
};
exports.BreadcrumbSeparator = BreadcrumbSeparator;
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";
var BreadcrumbEllipsis = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsxs)("span", __assign({ role: "presentation", "aria-hidden": "true", className: (0, utils_1.cn)("flex h-9 w-9 items-center justify-center", className) }, props, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MoreHorizontal, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("span", { className: "sr-only", children: "More" })] })));
};
exports.BreadcrumbEllipsis = BreadcrumbEllipsis;
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis";
