"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { id } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
    value?: Date;
    onChange?: (date?: Date) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    showYearPicker?: boolean;
    dateFormat?: string;
}

export function DatePicker({
                               value,
                               onChange,
                               placeholder = "Pilih tanggal",
                               disabled = false,
                               className,
                               showYearPicker = false,
                               dateFormat = "dd/MM/yyyy",
                           }: DatePickerProps) {
    const [month, setMonth] = React.useState<Date | undefined>(value || new Date());
    const [calendarOpen, setCalendarOpen] = React.useState(false);

    // Generate array of years for year picker (20 years back and 10 years ahead)
    const currentYear = new Date().getFullYear();
    const years = React.useMemo(() => {
        const yearArray = [];
        for (let year = currentYear - 80; year <= currentYear + 10; year++) {
            yearArray.push(year);
        }
        return yearArray;
    }, [currentYear]);

    // Handle year selection
    const handleYearSelect = (year: string) => {
        const newDate = new Date(month || new Date());
        newDate.setFullYear(parseInt(year));
        setMonth(newDate);

        if (showYearPicker) {
            onChange?.(newDate);
            setCalendarOpen(false);
        }
    };

    // Handle month selection
    const handleMonthSelect = (monthIndex: string) => {
        const newDate = new Date(month || new Date());
        newDate.setMonth(parseInt(monthIndex));
        setMonth(newDate);
    };

    // Format the date for display
    const displayDate = React.useMemo(() => {
        if (!value) return placeholder;

        if (showYearPicker && dateFormat === "YYYY") {
            return format(value, "yyyy", { locale: id });
        }

        return format(value, dateFormat, { locale: id });
    }, [value, placeholder, showYearPicker, dateFormat]);

    // Generate months for month selector
    const months = React.useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => {
            const date = new Date();
            date.setMonth(i);
            return {
                value: i.toString(),
                label: format(date, "MMMM", { locale: id })
            };
        });
    }, []);

    return (
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                    onClick={() => setCalendarOpen(true)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {displayDate}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                {/* Year and Month Selectors */}
                <div className="flex p-3 space-x-2 items-center justify-between border-b">
                    {!showYearPicker && (
                        <Select
                            value={month ? month.getMonth().toString() : new Date().getMonth().toString()}
                            onValueChange={handleMonthSelect}
                        >
                            <SelectTrigger className="w-[140px] h-8">
                                <SelectValue placeholder="Pilih bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((month) => (
                                    <SelectItem key={month.value} value={month.value}>
                                        {month.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <Select
                        value={month ? month.getFullYear().toString() : new Date().getFullYear().toString()}
                        onValueChange={handleYearSelect}
                    >
                        <SelectTrigger className={cn("h-8", showYearPicker ? "w-full" : "w-[100px]")}>
                            <SelectValue placeholder="Pilih tahun" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Only render the calendar if not in year picker mode */}
                {!showYearPicker && (
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={onChange}
                        month={month}
                        onMonthChange={setMonth}
                        initialFocus
                        disabled={disabled}
                        locale={id}
                    />
                )}
            </PopoverContent>
        </Popover>
    );
}
