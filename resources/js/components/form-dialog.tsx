import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FormDialogProps {
    title: string;
    description?: string;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    isProcessing?: boolean;
    submitLabel?: string;
    processingLabel?: string;
    children: React.ReactNode;
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
                               children
                           }: FormDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="space-y-2 py-5">
                        {children}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isProcessing}
                        >
                            {isProcessing ? processingLabel : submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
