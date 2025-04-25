import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { usePermissions } from "@/hooks/use-permissions";
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";

interface InventoryLayoutProps {
    children: React.ReactNode;
    fullWidth?: boolean;
}

export default function InventoryLayout({ children, fullWidth = false }: InventoryLayoutProps) {
    const { hasPermission } = usePermissions();
    const currentPath = window.location.pathname;
    const [isMobile, setIsMobile] = useState(false);
    const [startIndex, setStartIndex] = useState(0);

    const sidebarNavItems: NavItem[] = [
        hasPermission('read_item_category') && {
            title: 'Category',
            url: '/inventory/category',
        },
        {
            title: 'Wholesale Unit',
            url: '/inventory/wholesale-unit',
        },
        hasPermission('read_item_unit') && {
            title: 'Retail Unit',
            url: '/inventory/unit',
        },
        {
            title: 'Item',
            url: '/inventory/item',
        }
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
        setStartIndex(prevIndex => Math.max(0, prevIndex - 1));
    };

    const handleNext = () => {
        const maxVisibleTabs = 3;
        setStartIndex(prevIndex => Math.min(sidebarNavItems.length - maxVisibleTabs, prevIndex + 1));
    };

    const renderMobileTabs = () => {
        const maxVisibleTabs = 3;
        const visibleItems = sidebarNavItems.slice(startIndex, startIndex + maxVisibleTabs);

        return (
            <div className="flex items-center w-full">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    disabled={startIndex === 0}
                    className="h-8 w-8 shrink-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex-1 flex justify-between bg-muted/50 rounded-md p-1">
                    {visibleItems.map((item) => (
                        <Link
                            key={item.url}
                            href={item.url}
                            className={cn(
                                "flex-1 text-center py-1.5 px-2 text-sm rounded-md transition-colors",
                                currentPath === item.url
                                    ? "bg-background text-foreground font-medium"
                                    : "text-muted-foreground hover:text-foreground"
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
        <div className="px-4 sm:px-6 md:px-8 py-6">
            <Heading title="Inventory" description="Manage your Inventory" />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                {isMobile && (
                    <div className="w-full">
                        {renderMobileTabs()}
                        <Separator className="my-6" />
                    </div>
                )}

                {!isMobile && (
                    <aside className="w-full lg:w-48 shrink-0">
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
                )}

                {!isMobile && <Separator orientation="vertical" className="h-auto" />}

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
