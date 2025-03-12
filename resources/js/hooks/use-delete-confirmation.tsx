import { useState } from "react";
import { router } from '@inertiajs/react';

interface UseDeleteConfirmationProps {
    route: string;
    onSuccess?: () => void;
}

export function useDeleteConfirmation({ route, onSuccess }: UseDeleteConfirmationProps) {
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const handleDelete = () => {
        router.delete(route, {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteAlert(false);
                onSuccess?.();
            },
        });
    };

    return {
        showDeleteAlert,
        setShowDeleteAlert,
        handleDelete,
    };
}
