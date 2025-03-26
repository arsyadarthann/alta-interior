import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export function usePermissions() {
    const { auth } = usePage<SharedData>().props;

    const hasRole = (name: string) => {
        if (typeof auth.user.role === 'string') {
            return auth.user.role === name;
        }

        return Array.isArray(auth.user.role) && auth.user.role.includes(name);
    }


    const hasPermission = (name: string) => {
        return Array.isArray(auth.user.permissions) && auth.user.permissions.includes(name);
    };

    return { hasRole, hasPermission };
}
