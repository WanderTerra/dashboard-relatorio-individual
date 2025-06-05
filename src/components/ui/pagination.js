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
exports.PaginationEllipsis = exports.PaginationNext = exports.PaginationPrevious = exports.PaginationItem = exports.PaginationLink = exports.PaginationContent = exports.Pagination = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var React = require("react");
var lucide_react_1 = require("lucide-react");
var utils_1 = require("@/lib/utils");
var button_1 = require("@/components/ui/button");
var Pagination = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("nav", __assign({ role: "navigation", "aria-label": "pagination", className: (0, utils_1.cn)("mx-auto flex w-full justify-center", className) }, props)));
};
exports.Pagination = Pagination;
Pagination.displayName = "Pagination";
var PaginationContent = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("ul", __assign({ ref: ref, className: (0, utils_1.cn)("flex flex-row items-center gap-1", className) }, props)));
});
exports.PaginationContent = PaginationContent;
PaginationContent.displayName = "PaginationContent";
var PaginationItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("li", __assign({ ref: ref, className: (0, utils_1.cn)("", className) }, props)));
});
exports.PaginationItem = PaginationItem;
PaginationItem.displayName = "PaginationItem";
var PaginationLink = function (_a) {
    var className = _a.className, isActive = _a.isActive, _b = _a.size, size = _b === void 0 ? "icon" : _b, props = __rest(_a, ["className", "isActive", "size"]);
    return ((0, jsx_runtime_1.jsx)("a", __assign({ "aria-current": isActive ? "page" : undefined, className: (0, utils_1.cn)((0, button_1.buttonVariants)({
            variant: isActive ? "outline" : "ghost",
            size: size,
        }), className) }, props)));
};
exports.PaginationLink = PaginationLink;
PaginationLink.displayName = "PaginationLink";
var PaginationPrevious = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsxs)(PaginationLink, __assign({ "aria-label": "Go to previous page", size: "default", className: (0, utils_1.cn)("gap-1 pl-2.5", className) }, props, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ChevronLeft, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("span", { children: "Previous" })] })));
};
exports.PaginationPrevious = PaginationPrevious;
PaginationPrevious.displayName = "PaginationPrevious";
var PaginationNext = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsxs)(PaginationLink, __assign({ "aria-label": "Go to next page", size: "default", className: (0, utils_1.cn)("gap-1 pr-2.5", className) }, props, { children: [(0, jsx_runtime_1.jsx)("span", { children: "Next" }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "h-4 w-4" })] })));
};
exports.PaginationNext = PaginationNext;
PaginationNext.displayName = "PaginationNext";
var PaginationEllipsis = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsxs)("span", __assign({ "aria-hidden": true, className: (0, utils_1.cn)("flex h-9 w-9 items-center justify-center", className) }, props, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.MoreHorizontal, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("span", { className: "sr-only", children: "More pages" })] })));
};
exports.PaginationEllipsis = PaginationEllipsis;
PaginationEllipsis.displayName = "PaginationEllipsis";
