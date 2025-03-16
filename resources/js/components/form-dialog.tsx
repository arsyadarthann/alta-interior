import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import React from 'react';

interface FormDialogProps {
    title: string;
    description?: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (e: React.FormEvent) => void;
    isProcessing?: boolean;
    submitLabel?: string;
    processingLabel?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    hideSubmitButton?: boolean;
}

export function FormDialog({
    title,
    description,
    isOpen,
    onClose,
    onSubmit,
    isProcessing = false,
    submitLabel = 'Save',
    processingLabel = 'Saving...',
    children,
    size = 'md',
    hideSubmitButton = false,
}: FormDialogProps) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        xxl: 'max-w-6xl',
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn(sizeClasses[size])}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="space-y-2 py-5">{children}</div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        {!hideSubmitButton && (
                            <Button type="submit" disabled={isProcessing}>
                                {isProcessing ? processingLabel : submitLabel}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
