import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
    ({ className, type, onChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (type === 'phone') {
                let value = e.target.value;
                value = value.replace(/\D/g, '');

                if (value.startsWith('620')) {
                    value = '62' + value.slice(3);
                } else if (value.startsWith('0')) {
                    value = '62' + value.slice(1);
                } else if (value.startsWith('8')) {
                    value = '62' + value;
                } else if (value === '') {
                    value = '';
                } else if (!value.startsWith('62')) {
                    value = '62' + value;
                }

                value = value.slice(0, 15);

                const newEvent = {
                    ...e,
                    target: { ...e.target, value }
                };

                onChange?.(newEvent as React.ChangeEvent<HTMLInputElement>);
            } else {
                onChange?.(e);
            }
        };

        return (
            <input
                type={type === 'phone' ? 'text' : type}
                className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                    className,
                )}
                onChange={handleChange}
                ref={ref}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';

export { Input };
