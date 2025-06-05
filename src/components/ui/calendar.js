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
exports.Calendar = Calendar;
var jsx_runtime_1 = require("react/jsx-runtime");
var lucide_react_1 = require("lucide-react");
var react_day_picker_1 = require("react-day-picker");
var utils_1 = require("@/lib/utils");
var button_1 = require("@/components/ui/button");
function Calendar(_a) {
    var className = _a.className, classNames = _a.classNames, _b = _a.showOutsideDays, showOutsideDays = _b === void 0 ? true : _b, props = __rest(_a, ["className", "classNames", "showOutsideDays"]);
    return ((0, jsx_runtime_1.jsx)(react_day_picker_1.DayPicker, __assign({ showOutsideDays: showOutsideDays, className: (0, utils_1.cn)("p-3", className), classNames: __assign({ months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0", month: "space-y-4", caption: "flex justify-center pt-1 relative items-center", caption_label: "text-sm font-medium", nav: "space-x-1 flex items-center", nav_button: (0, utils_1.cn)((0, button_1.buttonVariants)({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"), nav_button_previous: "absolute left-1", nav_button_next: "absolute right-1", table: "w-full border-collapse space-y-1", head_row: "flex", head_cell: "text-zinc-500 rounded-md w-8 font-normal text-[0.8rem] dark:text-zinc-400", row: "flex w-full mt-2", cell: (0, utils_1.cn)("relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-zinc-100 [&:has([aria-selected].day-outside)]:bg-zinc-100/50 [&:has([aria-selected].day-range-end)]:rounded-r-md dark:[&:has([aria-selected])]:bg-zinc-800 dark:[&:has([aria-selected].day-outside)]:bg-zinc-800/50", props.mode === "range"
                ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
                : "[&:has([aria-selected])]:rounded-md"), day: (0, utils_1.cn)((0, button_1.buttonVariants)({ variant: "ghost" }), "h-8 w-8 p-0 font-normal aria-selected:opacity-100"), day_range_start: "day-range-start", day_range_end: "day-range-end", day_selected: "bg-zinc-900 text-zinc-50 hover:bg-zinc-900 hover:text-zinc-50 focus:bg-zinc-900 focus:text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50 dark:hover:text-zinc-900 dark:focus:bg-zinc-50 dark:focus:text-zinc-900", day_today: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50", day_outside: "day-outside text-zinc-500 aria-selected:bg-zinc-100/50 aria-selected:text-zinc-500 dark:text-zinc-400 dark:aria-selected:bg-zinc-800/50 dark:aria-selected:text-zinc-400", day_disabled: "text-zinc-500 opacity-50 dark:text-zinc-400", day_range_middle: "aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-50", day_hidden: "invisible" }, classNames), components: {
            IconLeft: function (_a) {
                var className = _a.className, props = __rest(_a, ["className"]);
                return ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronLeft, __assign({ className: (0, utils_1.cn)("h-4 w-4", className) }, props)));
            },
            IconRight: function (_a) {
                var className = _a.className, props = __rest(_a, ["className"]);
                return ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, __assign({ className: (0, utils_1.cn)("h-4 w-4", className) }, props)));
            },
        } }, props)));
}
Calendar.displayName = "Calendar";
