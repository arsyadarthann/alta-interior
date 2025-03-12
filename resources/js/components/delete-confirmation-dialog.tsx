import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    buttonClassName?: string;
    buttonText?: string;
}

export function DeleteConfirmationDialog({
                                             isOpen,
                                             onOpenChange,
                                             onConfirm,
                                             title = "Are you sure?",
                                             description = "This action cannot be undone. This will permanently delete the data from the server.",
                                             buttonClassName = "bg-red-600 hover:bg-red-700",
                                             buttonText = "Delete"
                                         }: DeleteConfirmationDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={buttonClassName}
                    >
                        {buttonText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
