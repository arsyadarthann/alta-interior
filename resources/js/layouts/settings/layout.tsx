import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {usePermissions} from "@/hooks/use-permissions";

interface SettingsLayoutProps {
    children: React.ReactNode;
    fullWidth?: boolean;
}

export default function SettingsLayout({ children, fullWidth = false }: SettingsLayoutProps) {
    const { hasPermission } = usePermissions();

    const currentPath = window.location.pathname;

    const sidebarNavItems: NavItem[] = [
        {
            title: 'Profile',
            url: '/settings/profile',
            icon: null,
        },
        {
            title: 'Password',
            url: '/settings/password',
            icon: null,
        },
        hasPermission('read_permission') && {
            title: 'Permission',
            url: '/settings/permissions',
            icon: null,
        },
        hasPermission('read_role') && {
            title: 'Role',
            url: '/settings/roles',
            icon: null,
        },
        {
            title: 'User Account',
            url: '/settings/users',
            icon: null,
        }
    ].filter(Boolean) as NavItem[];

    return (
        <div className="px-8 py-6">
            <Heading title="Settings" description="Manage your account and app settings" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {sidebarNavItems.map((item) => (
                            <Button
                                key={item.url}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': currentPath === item.url,
                                })}
                            >
                                <Link href={item.url}>
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className={cn("flex-1", {
                    "md:max-w-2xl": !fullWidth
                })}>
                    <section className={cn("space-y-12", {
                        "max-w-xl": !fullWidth
                    })}>
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
