import {router, usePage} from '@inertiajs/react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { type SharedData, type Toast } from '@/types';

interface ErrorResponse {
    [key: string]: string;
}

export function useToastNotification() {
    const { flash } = usePage<SharedData>().props;
    const { toast, dismiss } = useToast();

    useEffect(() => {
        const hasToastBeenShown = sessionStorage.getItem('toastShown');

        if (flash?.toast && !hasToastBeenShown) {
            const flashToast = flash.toast as Toast;
            sessionStorage.setItem('toastShown', 'true');

            toast({
                variant: flashToast.variant,
                title: flashToast.title,
                description: flashToast.description,
                duration: 5000,
            });

            const cleanup = router.on('navigate', () => {
                sessionStorage.removeItem('toastShown');
                dismiss();
                cleanup();
            });
        }

        return () => {
            sessionStorage.removeItem('toastShown');
            dismiss();
        };
    }, [flash]);

    const showErrorToast = (err?: ErrorResponse) => {
        dismiss();

        if (err && Object.keys(err).length > 0) {
            const ErrorList = () => (
                <div className="flex flex-col gap-1">
                    {Object.values(err).map((error, index) => (
                        <div key={index}>• {error}</div>
                    ))}
                </div>
            );

            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: <ErrorList />,
                duration: 5000,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'There was an error processing your request.',
                duration: 5000,
            });
        }
    };

    return { showErrorToast };
}
