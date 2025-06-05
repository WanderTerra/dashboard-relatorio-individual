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
exports.InputOTPSeparator = exports.InputOTPSlot = exports.InputOTPGroup = exports.InputOTP = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var React = require("react");
var input_otp_1 = require("input-otp");
var lucide_react_1 = require("lucide-react");
var utils_1 = require("@/lib/utils");
var InputOTP = React.forwardRef(function (_a, ref) {
    var className = _a.className, containerClassName = _a.containerClassName, props = __rest(_a, ["className", "containerClassName"]);
    return ((0, jsx_runtime_1.jsx)(input_otp_1.OTPInput, __assign({ ref: ref, containerClassName: (0, utils_1.cn)("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName), className: (0, utils_1.cn)("disabled:cursor-not-allowed", className) }, props)));
});
exports.InputOTP = InputOTP;
InputOTP.displayName = "InputOTP";
var InputOTPGroup = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return ((0, jsx_runtime_1.jsx)("div", __assign({ ref: ref, className: (0, utils_1.cn)("flex items-center", className) }, props)));
});
exports.InputOTPGroup = InputOTPGroup;
InputOTPGroup.displayName = "InputOTPGroup";
var InputOTPSlot = React.forwardRef(function (_a, ref) {
    var index = _a.index, className = _a.className, props = __rest(_a, ["index", "className"]);
    var inputOTPContext = React.useContext(input_otp_1.OTPInputContext);
    var _b = inputOTPContext.slots[index], char = _b.char, hasFakeCaret = _b.hasFakeCaret, isActive = _b.isActive;
    return ((0, jsx_runtime_1.jsxs)("div", __assign({ ref: ref, className: (0, utils_1.cn)("relative flex h-9 w-9 items-center justify-center border-y border-r border-zinc-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-zinc-800", isActive && "z-10 ring-1 ring-zinc-950 dark:ring-zinc-300", className) }, props, { children: [char, hasFakeCaret && ((0, jsx_runtime_1.jsx)("div", { className: "pointer-events-none absolute inset-0 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("div", { className: "h-4 w-px animate-caret-blink bg-zinc-950 duration-1000 dark:bg-zinc-50" }) }))] })));
});
exports.InputOTPSlot = InputOTPSlot;
InputOTPSlot.displayName = "InputOTPSlot";
var InputOTPSeparator = React.forwardRef(function (_a, ref) {
    var props = __rest(_a, []);
    return ((0, jsx_runtime_1.jsx)("div", __assign({ ref: ref, role: "separator" }, props, { children: (0, jsx_runtime_1.jsx)(lucide_react_1.Minus, {}) })));
});
exports.InputOTPSeparator = InputOTPSeparator;
InputOTPSeparator.displayName = "InputOTPSeparator";
