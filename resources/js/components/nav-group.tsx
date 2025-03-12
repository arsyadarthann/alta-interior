import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Extend NavItem type to include optional children
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

    const renderMenuItem = (item: NavItemWithChildren) => {
        if (item.children) {
            return (
                <SidebarMenuItem key={item.title}>
                    <Collapsible>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="w-full justify-between">
                                <div className="flex items-center">
                                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                    <span>{item.title}</span>
                                </div>
                                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="ml-4 border-l pl-2">
                                {/* Gunakan div alih-alih SidebarMenuItem untuk child items */}
                                {item.children.map((child) => (
                                    <div key={child.title} className="py-1"> {/* Ganti SidebarMenuItem dengan div */}
                                        <SidebarMenuButton
                                            asChild
                                            isActive={child.url === page.url}
                                        >
                                            <Link href={child.url}>
                                                {child.icon && <child.icon className="mr-2 h-4 w-4" />}
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
                <SidebarMenuButton asChild isActive={item.url === page.url}>
                    <Link href={item.url}>
                        {item.icon && <item.icon />}
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
