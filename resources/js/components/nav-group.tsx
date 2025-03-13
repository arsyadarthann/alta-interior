import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface NavItemWithChildren extends NavItem {
    children?: NavItem[];
}

export function NavMainWithSubmenu({
                                       items = [],
                                       title
                                   }: {
    items: NavItemWithChildren[],
    title?: string
}) {
    const page = usePage();

    const isActiveOrHasActiveChild = (itemUrl: string) => {
        if (!itemUrl) return false;

        const currentUrl = page.url;
        return currentUrl === itemUrl || (
            currentUrl.startsWith(itemUrl) &&
            (itemUrl.endsWith('/') || currentUrl.charAt(itemUrl.length) === '/')
        );
    };

    const renderMenuItem = (item: NavItemWithChildren) => {
        const isActive = isActiveOrHasActiveChild(item.url);

        if (item.children) {
            const hasActiveChild = item.children.some(child =>
                isActiveOrHasActiveChild(child.url)
            );

            return (
                <SidebarMenuItem key={item.title}>
                    <Collapsible defaultOpen={hasActiveChild}>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                className="w-full justify-between"
                                isActive={isActive || hasActiveChild}
                            >
                                <div className="flex items-center">
                                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                    <span>{item.title}</span>
                                </div>
                                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="ml-4 border-l pl-2">
                                {item.children.map((child) => (
                                    <div key={child.title} className="py-1">
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActiveOrHasActiveChild(child.url)}
                                        >
                                            <Link href={child.url}>
                                                {child.icon && <child.icon className="h-4 w-4" />}
                                                <span>{child.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </SidebarMenuItem>
            );
        }

        return (
            <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.url}>
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{title ?? "Title Menu"}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map(renderMenuItem)}
            </SidebarMenu>
        </SidebarGroup>
    );
}
