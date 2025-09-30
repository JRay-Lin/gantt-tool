"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Select date",
    className,
    disabled = false,
    minDate,
    maxDate,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [month, setMonth] = React.useState<Date | undefined>(value);

    const handleSelect = (selectedDate: Date | undefined) => {
        onChange?.(selectedDate);
        setOpen(false);
    };

    // Update month when value changes or when opening the popover
    React.useEffect(() => {
        if (open && value) {
            setMonth(value);
        }
    }, [open, value]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    {value ? format(value, "yyyy/MM/dd") : placeholder}
                    <ChevronDownIcon className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
            >
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleSelect}
                    month={month}
                    onMonthChange={setMonth}
                    captionLayout="dropdown"
                    disabled={(date) => {
                        if (minDate && date < minDate) return true;
                        if (maxDate && date > maxDate) return true;
                        return false;
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}

// Demo component for testing
export function DatePickerDemo() {
    const [date, setDate] = React.useState<Date | undefined>(undefined);

    return (
        <DatePicker
            value={date}
            onChange={setDate}
            placeholder="Pick a date"
        />
    );
}