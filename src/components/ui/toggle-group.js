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
exports.ToggleGroupItem = exports.ToggleGroup = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var React = require("react");
var ToggleGroupPrimitive = require("@radix-ui/react-toggle-group");
var utils_1 = require("@/lib/utils");
var toggle_1 = require("@/components/ui/toggle");
var ToggleGroupContext = React.createContext({
    size: "default",
    variant: "default",
});
var ToggleGroup = React.forwardRef(function (_a, ref) {
    var className = _a.className, variant = _a.variant, size = _a.size, children = _a.children, props = __rest(_a, ["className", "variant", "size", "children"]);
    return ((0, jsx_runtime_1.jsx)(ToggleGroupPrimitive.Root, __assign({ ref: ref, className: (0, utils_1.cn)("flex items-center justify-center gap-1", className) }, props, { children: (0, jsx_runtime_1.jsx)(ToggleGroupContext.Provider, { value: { variant: variant, size: size }, children: children }) })));
});
exports.ToggleGroup = ToggleGroup;
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;
var ToggleGroupItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, variant = _a.variant, size = _a.size, props = __rest(_a, ["className", "children", "variant", "size"]);
    var context = React.useContext(ToggleGroupContext);
    return ((0, jsx_runtime_1.jsx)(ToggleGroupPrimitive.Item, __assign({ ref: ref, className: (0, utils_1.cn)((0, toggle_1.toggleVariants)({
            variant: context.variant || variant,
            size: context.size || size,
        }), className) }, props, { children: children })));
});
exports.ToggleGroupItem = ToggleGroupItem;
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;
