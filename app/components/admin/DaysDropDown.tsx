"use client";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar as CalendarIcon, Filter } from "lucide-react";

interface DaysDropDownProps {
    setDays: (days: number) => void;
    days: number;
    setCustomFromTo: (input: { from: string, to: string } | null) => void;
    customFromTo?: { from: string; to: string } | null;
}

const options = [
    { days: 1, label: "📅 Diario (Hoy)" },
    { days: 7, label: "📅 Semanal (Últimos 7 días)" },
    { days: 30, label: "📅 Mensual (Últimos 30 días)" },
    { days: 90, label: "📅 Trimestral (Últimos 90 días)" },
    { days: 365, label: "📅 Anual (Últimos 365 días)" }
];

export default function DaysDropDown({ setDays, days, setCustomFromTo, customFromTo }: DaysDropDownProps) {
    const [showCustom, setShowCustom] = useState(Boolean(customFromTo));
    const [customDateFrom, setCustomDateFrom] = useState(customFromTo?.from || "");
    const [customDateTo, setCustomDateTo] = useState(customFromTo?.to || "");

    const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const from = e.target.value;
        setCustomDateFrom(from);
        if (customDateTo) {
            const diff = Math.round((new Date(customDateTo).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));
            if (diff >= 0) {
                setDays(diff === 0 ? 1 : diff);
                setCustomFromTo({ from, to: customDateTo });
            }
        }
    };

    const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const to = e.target.value;
        setCustomDateTo(to);
        if (customDateFrom) {
            const diff = Math.round((new Date(to).getTime() - new Date(customDateFrom).getTime()) / (1000 * 60 * 60 * 24));
            if (diff >= 0) {
                setDays(diff === 0 ? 1 : diff);
                setCustomFromTo({ from: customDateFrom, to });
            }
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-200 shadow-xs">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold px-1">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Período:</span>
            </div>

            <Select
                defaultValue={customFromTo ? "custom" : days.toString()}
                value={customFromTo ? "custom" : days.toString()}
                onValueChange={(value) => {
                    if (value === "custom") {
                        setShowCustom(true);
                    } else {
                        setShowCustom(false);
                        setCustomFromTo(null);
                        setCustomDateFrom("");
                        setCustomDateTo("");
                        setDays(Number(value));
                    }
                }}
            >
                <SelectTrigger className="text-xs font-bold border-gray-200 rounded-xl bg-gray-50/60 min-w-[200px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                    <SelectGroup>
                        {options.map(option => (
                            <SelectItem key={option.days} value={option.days.toString()} className="text-xs font-semibold">
                                {option.label}
                            </SelectItem>
                        ))}
                        <SelectItem value="custom" className="text-xs font-bold text-emerald-700">
                            ✨ Rango personalizado...
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

            {showCustom && (
                <div className="flex flex-wrap items-center gap-2 text-xs bg-emerald-50/50 p-1.5 px-3 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-600">Desde:</span>
                        <input
                            type="date"
                            value={customDateFrom}
                            max={customDateTo || new Date().toISOString().split("T")[0]}
                            onChange={handleFromChange}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-emerald-600"
                        />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-600">Hasta:</span>
                        <input
                            type="date"
                            value={customDateTo}
                            min={customDateFrom}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={handleToChange}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-emerald-600"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}