"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Combobox = Combobox;
var jsx_runtime_1 = require("react/jsx-runtime");
var React = require("react");
var lucide_react_1 = require("lucide-react");
var utils_1 = require("../../lib/utils");
var button_1 = require("./button");
var command_1 = require("./command");
var popover_1 = require("./popover");
function Combobox(_a) {
    var _b;
    var options = _a.options, value = _a.value, onChange = _a.onChange, _c = _a.placeholder, placeholder = _c === void 0 ? "Selecionar..." : _c, _d = _a.emptyMessage, emptyMessage = _d === void 0 ? "Não encontrado." : _d, className = _a.className;
    var _e = React.useState(false), open = _e[0], setOpen = _e[1];
    // Manipulador para quando o botão é clicado
    var handleButtonClick = function (e) {
        // Impede navegação, mas permite que o Popover seja controlado pelo onOpenChange
        e.stopPropagation();
    };
    // Manipulador para seleção de item
    var handleSelect = function (currentValue) {
        onChange(currentValue === value ? "" : currentValue);
        setOpen(false);
    };
    return ((0, jsx_runtime_1.jsxs)(popover_1.Popover, { open: open, onOpenChange: setOpen, children: [(0, jsx_runtime_1.jsx)(popover_1.PopoverTrigger, { asChild: true, children: (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "button", variant: "outline", role: "combobox", "aria-expanded": open, onClick: handleButtonClick, className: (0, utils_1.cn)("w-full h-9 justify-between px-3 py-2 border border-zinc-200 text-sm bg-white", className), children: [value
                            ? ((_b = options.find(function (option) { return option.value === value; })) === null || _b === void 0 ? void 0 : _b.label) || value
                            : placeholder, (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronsUpDown, { className: "ml-2 h-4 w-4 shrink-0 opacity-50" })] }) }), (0, jsx_runtime_1.jsx)(popover_1.PopoverContent, { className: "w-[200px] p-0", sideOffset: 4, children: (0, jsx_runtime_1.jsxs)(command_1.Command, { children: [(0, jsx_runtime_1.jsx)(command_1.CommandInput, { placeholder: "Pesquisar ".concat(placeholder.toLowerCase()) }), (0, jsx_runtime_1.jsx)(command_1.CommandEmpty, { children: emptyMessage }), (0, jsx_runtime_1.jsx)(command_1.CommandGroup, { className: "max-h-60 overflow-auto", children: options.map(function (option) { return ((0, jsx_runtime_1.jsxs)(command_1.CommandItem, { value: option.value, onSelect: function () { return handleSelect(option.value); }, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: (0, utils_1.cn)("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0") }), option.label] }, option.value)); }) })] }) })] }));
}
