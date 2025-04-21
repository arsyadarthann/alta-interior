import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
    if (amount === null || amount === undefined) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(0);
    }

    const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;

    if (isNaN(numericAmount)) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(0);
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numericAmount);
}

export function formatDecimal(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    const parts = rounded.toString().split('.');
    if (!parts[1] || parseInt(parts[1]) === 0) {
        return parts[0];
    }
    return rounded.toString();
}

export function formatDate(
    dateString: string | Date,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    },
): string {
    if (!dateString) return '-';

    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

        if (isNaN(date.getTime())) {
            return '-';
        }

        return new Intl.DateTimeFormat('id-Id', options).format(date);
    } catch (error) {
        console.error('Error formatting date:', error);
        return '-';
    }
}

export function formatDateToYmd(date: Date | null | undefined): string {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
