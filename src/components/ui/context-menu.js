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
exports.ContextMenuRadioGroup = exports.ContextMenuSubTrigger = exports.ContextMenuSubContent = exports.ContextMenuSub = exports.ContextMenuPortal = exports.ContextMenuGroup = exports.ContextMenuShortcut = exports.ContextMenuSeparator = exports.ContextMenuLabel = exports.ContextMenuRadioItem = exports.ContextMenuCheckboxItem = exports.ContextMenuItem = exports.ContextMenuContent = exports.ContextMenuTrigger = exports.ContextMenu = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var React = require("react");
var ContextMenuPrimitive = require("@radix-ui/react-context-menu");
var lucide_react_1 = require("lucide-react");
var utils_1 = require("@/lib/utils");
var ContextMenu = ContextMenuPrimitive.Root;
exports.ContextMenu = ContextMenu;
var ContextMenuTrigger = ContextMenuPrimitive.Trigger;
exports.ContextMenuTrigger = ContextMenuTrigger;
var ContextMenuGroup = ContextMenuPrimitive.Group;
exports.ContextMenuGroup = ContextMenuGroup;
var ContextMenuPortal = ContextMenuPrimitive.Portal;
exports.ContextMenuPortal = ContextMenuPortal;
var ContextMenuSub = ContextMenuPrimitive.Sub;
exports.ContextMenuSub = ContextMenuSub;
var ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;
exports.ContextMenuRadioGroup = ContextMenuRadioGroup;
var ContextMenuSubTrigger = React.forwardRef(function (_a, ref) {
    var className = _a.className, inset = _a.inset, children = _a.children, props = __rest(_a, ["className", "inset", "children"]);
    return ((0, jsx_runtime_1.jsxs)(ContextMenuPrimitive.SubTrigger, __assign({ ref: ref, className: (0, utils_1.cn)("flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-zinc-100 focus:text-zinc-900 data-[state=open]:bg-zinc-100 data-[state=open]:text-zinc-900 dark:focus:bg-zinc-800 dark:focus:text-zinc-50 dark:data-[state=open]:bg-zinc-800 dark:data-[state=open]:text-zinc-50", inset && "pl-8", className) }, props, { children: [children, (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "ml-auto h-4 w-4" })] })));
});
exports.ContextMenuSubTrigger = ContextMenuSubTrigger;
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;
var ContextMenuSubContent = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(ContextMenuPrimitive.SubContent, __assign({ ref: ref, className: (0, utils_1.cn)("z-50 min-w-[8rem] overflow-hidden rounded-md border border-zinc-200 bg-white p-1 text-zinc-950 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50", className) }, props)));
});
exports.ContextMenuSubContent = ContextMenuSubContent;
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;
var ContextMenuContent = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(ContextMenuPrimitive.Portal, { children: (0, jsx_runtime_1.jsx)(ContextMenuPrimitive.Content, __assign({ ref: ref, className: (0, utils_1.cn)("z-50 min-w-[8rem] overflow-hidden rounded-md border border-zinc-200 bg-white p-1 text-zinc-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50", className) }, props)) }));
});
exports.ContextMenuContent = ContextMenuContent;
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;
var ContextMenuItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, inset = _a.inset, props = __rest(_a, ["className", "inset"]);
    return ((0, jsx_runtime_1.jsx)(ContextMenuPrimitive.Item, __assign({ ref: ref, className: (0, utils_1.cn)("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-zinc-100 focus:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-zinc-800 dark:focus:text-zinc-50", inset && "pl-8", className) }, props)));
});
exports.ContextMenuItem = ContextMenuItem;
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;
var ContextMenuCheckboxItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, checked = _a.checked, props = __rest(_a, ["className", "children", "checked"]);
    return ((0, jsx_runtime_1.jsxs)(ContextMenuPrimitive.CheckboxItem, __assign({ ref: ref, className: (0, utils_1.cn)("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-zinc-100 focus:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-zinc-800 dark:focus:text-zinc-50", className), checked: checked }, props, { children: [(0, jsx_runtime_1.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: (0, jsx_runtime_1.jsx)(ContextMenuPrimitive.ItemIndicator, { children: (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "h-4 w-4" }) }) }), children] })));
});
exports.ContextMenuCheckboxItem = ContextMenuCheckboxItem;
ContextMenuCheckboxItem.displayName =
    ContextMenuPrimitive.CheckboxItem.displayName;
var ContextMenuRadioItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return ((0, jsx_runtime_1.jsxs)(ContextMenuPrimitive.RadioItem, __assign({ ref: ref, className: (0, utils_1.cn)("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-zinc-100 focus:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-zinc-800 dark:focus:text-zinc-50", className) }, props, { children: [(0, jsx_runtime_1.jsx)("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: (0, jsx_runtime_1.jsx)(ContextMenuPrimitive.ItemIndicator, { children: (0, jsx_runtime_1.jsx)(lucide_react_1.Circle, { className: "h-4 w-4 fill-current" }) }) }), children] })));
});
exports.ContextMenuRadioItem = ContextMenuRadioItem;
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;
var ContextMenuLabel = React.forwardRef(function (_a, ref) {
    var className = _a.className, inset = _a.inset, props = __rest(_a, ["className", "inset"]);
    return ((0, jsx_runtime_1.jsx)(ContextMenuPrimitive.Label, __assign({ ref: ref, className: (0, utils_1.cn)("px-2 py-1.5 text-sm font-semibold text-zinc-950 dark:text-zinc-50", inset && "pl-8", className) }, props)));
});
exports.ContextMenuLabel = ContextMenuLabel;
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;
var ContextMenuSeparator = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)(ContextMenuPrimitive.Separator, __assign({ ref: ref, className: (0, utils_1.cn)("-mx-1 my-1 h-px bg-zinc-200 dark:bg-zinc-800", className) }, props)));
});
exports.ContextMenuSeparator = ContextMenuSeparator;
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;
var ContextMenuShortcut = function (_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("span", __assign({ className: (0, utils_1.cn)("ml-auto text-xs tracking-widest text-zinc-500 dark:text-zinc-400", className) }, props)));
};
exports.ContextMenuShortcut = ContextMenuShortcut;
ContextMenuShortcut.displayName = "ContextMenuShortcut";
