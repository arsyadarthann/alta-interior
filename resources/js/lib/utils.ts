import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDecimal(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    const parts = rounded.toString().split('.');
    if (!parts[1] || parseInt(parts[1]) === 0) {
        return parts[0];
    }
    return rounded.toString();
}
