import { type ColumnDef } from "@tanstack/react-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { useState } from "react";

interface ActionItem<TData> {
    label: string | ((data: TData) => string);
    onClick: (data: TData) => void;
    className?: string | ((data: TData) => string);
    icon?: React.ReactNode | ((data: TData) => React.ReactNode);
    showConfirmDialog?: boolean;
    confirmDialogProps?: {
        title?: string;
        description?: string;
        buttonClassName?: string;
        buttonText?: string;
    } | ((data: TData) => {
        title?: string;
        description?: string;
        buttonClassName?: string;
        buttonText?: string;
    });
    permission?: string;
    isHidden?: (data: TData) => boolean;
}

interface ActionColumnOptions<TData> {
    actions: (data: TData) => ActionItem<TData>[];
    hasPermission?: (permission: string) => boolean;
    isHighlighted?: (data: TData) => boolean;
}

export function ActionColumn<TData>({ actions, hasPermission, isHighlighted }: ActionColumnOptions<TData>): ColumnDef<TData> {
    return {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const data = row.original;
            const actionItems = actions(data)
                .filter(action =>
                    !action.permission ||
                    (hasPermission && hasPermission(action.permission))
                )
                .filter(action => !action.isHidden || !action.isHidden(data));

            const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
            const [selectedAction, setSelectedAction] = useState<ActionItem<TData> | null>(null);

            const handleActionClick = (action: ActionItem<TData>) => {
                if (action.showConfirmDialog) {
                    setSelectedAction(action);
                    setShowConfirmDialog(true);
                } else {
                    action.onClick(data);
                }
            };

            const handleConfirm = () => {
                if (selectedAction) {
                    selectedAction.onClick(data);
                    setShowConfirmDialog(false);
                }
            };

            if (isHighlighted && isHighlighted(data)) {
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_2px_#3b82f6]"></span>
                        Editing
                    </span>
                );
            }

            if (actionItems.length === 0) {
                return null;
            }

            return (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-transparent focus:ring-0 focus-visible:ring-0 focus:outline-none">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {actionItems.map((action, index) => (
                                <DropdownMenuItem
                                    key={index}
                                    onClick={() => handleActionClick(action)}
                                    className={typeof action.className === "function" ? action.className(data) : action.className}
                                >
                                    {action.icon && (
                                        <span className="mr-2 flex items-center justify-center">
                                            {typeof action.icon === "function" ? action.icon(data) : action.icon}
                                        </span>
                                    )}
                                    {typeof action.label === "function" ? action.label(data) : action.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {selectedAction?.showConfirmDialog && (
                        <DeleteConfirmationDialog
                            isOpen={showConfirmDialog}
                            onOpenChange={setShowConfirmDialog}
                            onConfirm={handleConfirm}
                            title={typeof selectedAction.confirmDialogProps === "function"
                                ? selectedAction.confirmDialogProps(data).title
                                : selectedAction.confirmDialogProps?.title}
                            description={typeof selectedAction.confirmDialogProps === "function"
                                ? selectedAction.confirmDialogProps(data).description
                                : selectedAction.confirmDialogProps?.description}
                            buttonClassName={typeof selectedAction.confirmDialogProps === "function"
                                ? selectedAction.confirmDialogProps(data).buttonClassName
                                : selectedAction.confirmDialogProps?.buttonClassName}
                            buttonText={typeof selectedAction.confirmDialogProps === "function"
                                ? selectedAction.confirmDialogProps(data).buttonText
                                : selectedAction.confirmDialogProps?.buttonText}
                        />
                    )}
                </>
            );
        },
    };
}
