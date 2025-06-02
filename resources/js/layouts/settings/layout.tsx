import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SettingsLayoutProps {
    children: React.ReactNode;
    fullWidth?: boolean;
}

export default function SettingsLayout({ children, fullWidth = false }: SettingsLayoutProps) {
    const { hasPermission } = usePermissions();
    const currentPath = window.location.pathname;
    const [isMobile, setIsMobile] = useState(false);
    const [startIndex, setStartIndex] = useState(0);

    const sidebarNavItems: NavItem[] = [
        {
            title: 'Profile',
            url: '/settings/profile',
            icon: null,
        },
        {
            title: 'Password',
            url: '/settings/password',
        },
        hasPermission('read_permission') && {
            title: 'Permission',
            url: '/settings/permissions',
        },
        hasPermission('read_role') && {
            title: 'Role',
            url: '/settings/roles',
        },
        hasPermission('read_user') && {
            title: 'User Account',
            url: '/settings/users',
        },
        // hasPermission('read_warehouse') && {
        //     title: 'Warehouse',
        //     url: '/settings/warehouses',
        // },
        hasPermission('read_branch') && {
            title: 'Branch',
            url: '/settings/branches',
        },
        hasPermission('read_tax_rate') && {
            title: 'Tax Rate',
            url: '/settings/tax-rates',
        },
        hasPermission('read_payment_method') && {
            title: 'Payment Method',
            url: '/settings/payment-methods',
        },
        hasPermission('read_transaction_prefix') && {
            title: 'Transaction Prefix',
            url: '/settings/transaction-prefix',
        },
    ].filter(Boolean) as NavItem[];

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const handlePrevious = () => {
        setStartIndex((prevIndex) => Math.max(0, prevIndex - 1));
    };

    const handleNext = () => {
        const maxVisibleTabs = 3;
        setStartIndex((prevIndex) => Math.min(sidebarNavItems.length - maxVisibleTabs, prevIndex + 1));
    };

    const renderMobileTabs = () => {
        const maxVisibleTabs = 3;
        const visibleItems = sidebarNavItems.slice(startIndex, startIndex + maxVisibleTabs);

        return (
            <div className="flex w-full items-center">
                <Button variant="ghost" size="icon" onClick={handlePrevious} disabled={startIndex === 0} className="h-8 w-8 shrink-0">
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="bg-muted/50 flex flex-1 justify-between rounded-md p-1">
                    {visibleItems.map((item) => (
                        <Link
                            key={item.url}
                            href={item.url}
                            className={cn(
                                'flex-1 rounded-md px-2 py-1.5 text-center text-sm transition-colors',
                                currentPath === item.url
                                    ? 'bg-background text-foreground font-medium'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {item.title}
                        </Link>
                    ))}
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={startIndex >= sidebarNavItems.length - maxVisibleTabs}
                    className="h-8 w-8 shrink-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    return (
        <div className="px-4 py-6 sm:px-6 md:px-8">
            <Heading title="Settings" description="Manage your account and app settings" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                {isMobile && (
                    <div className="w-full">
                        {renderMobileTabs()}
                        <Separator className="my-6" />
                    </div>
                )}

                {!isMobile && (
                    <aside className="w-full shrink-0 lg:w-48">
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
                                    <Link href={item.url}>{item.title}</Link>
                                </Button>
                            ))}
                        </nav>
                    </aside>
                )}

                {!isMobile && <Separator orientation="vertical" className="h-auto" />}

                <div
                    className={cn('flex-1', {
                        'md:max-w-2xl': !fullWidth,
                    })}
                >
                    <section
                        className={cn('space-y-12', {
                            'max-w-xl': !fullWidth,
                        })}
                    >
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
