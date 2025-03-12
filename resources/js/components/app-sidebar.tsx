import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from '@/components/ui/sidebar';
import {type NavItem, NavItemWithChildren} from '@/types';
import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    Users,
    BookUser,
    Truck,
    Warehouse,
    Utensils,
    Ticket,
    ClipboardList,
    PackageCheck, Receipt, ArrowDown, TrendingUp, Box
} from 'lucide-react';
import AppLogo from './app-logo';
import {NavMainWithSubmenu} from "@/components/nav-group";
import {usePermissions} from "@/hooks/use-permissions";

export function AppSidebar() {
    const { hasPermission } = usePermissions();

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: LayoutGrid,
        },
    ];

    const customersAndSuppliersItems: NavItem[] = [
        {
            title: 'Customers',
            url: '/customers',
            icon: BookUser,
        },
        hasPermission('read_supplier') && {
            title: 'Suppliers',
            url: route('suppliers.index'),
            icon: Truck
        }
    ].filter(Boolean) as NavItem[];

    const menuAndDiscountItems: NavItemWithChildren[] = [
        {
            title: 'Menu & Discounts',
            url: '',
            icon: Utensils,
            children: [
                {
                    title: 'Category',
                    url: '/categories',
                },
                {
                    title: 'Modifier',
                    url: '/modifiers',
                },
                {
                    title: 'Menu',
                    url: '/menus',
                }
            ]
        },
        {
            title: 'Discount',
            url: '/discounts',
            icon: Ticket
        }
    ]

    const inventoryAndStockItems: NavItemWithChildren[] = [
        {
            title: 'Inventory',
            url: '',
            icon: Warehouse,
            children: [
                {
                    title: 'Category',
                    url: '/categories',
                },
                {
                    title: 'Wholesale Unit',
                    url: '/wholesale-units',
                },
                {
                    title: 'Retail Unit',
                    url: '/retail-units',
                },
                {
                    title: 'Product',
                    url: '/products',
                }
            ]
        },
        {
            title: 'Stock Management',
            url: '',
            icon: ClipboardList,
            children: [
                {
                    title: 'Opname',
                    url: '/stock/opname',
                },
                {
                    title: 'Adjustment',
                    url: '/stock/adjustment',
                }
            ]
        }
    ]

    const procurementItems: NavItemWithChildren[] = [
        {
            title: 'Purchase Orders',
            url: '/procurement/orders',
            icon: ClipboardList,
        },
        {
            title: 'Goods Receipts',
            url: '/procurement/receipts',
            icon: PackageCheck
        },
        {
            title: 'Payables',
            url: '',
            icon: Receipt,
            children: [
                {
                    title: 'Supplier Invoice',
                    url: '/procurement/invoices',
                },
                {
                    title: 'Payments',
                    url: '/procurement/payments',
                }
            ]
        }
    ]

    const financeItems: NavItem[] = [
        {
            title: 'Expenses',
            url: '/expenses',
            icon: ArrowDown,
        },
    ]

    const reportItems: NavItem[] = [
        {
            title: 'Sales',
            url: '/reports/sales',
            icon: TrendingUp
        },
        {
            title: 'Transaction',
            url: '/reports/transactions',
            icon: Receipt,
        },
        {
            title: 'Inventory Movement',
            url: '/reports/inventory-movement',
            icon: Box,
        }
    ]

    return (
        <Sidebar collapsible="offcanvas" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} title="Dashboard"/>
                { (hasPermission('read_customer') || hasPermission('read_supplier')) && (
                    <NavMain items={customersAndSuppliersItems} title="Customers & Suppliers"/>
                )}
                <NavMainWithSubmenu items={menuAndDiscountItems} title="Menu & Discounts"/>
                <NavMainWithSubmenu items={inventoryAndStockItems} title="Inventory & Stock"/>
                <NavMainWithSubmenu items={procurementItems} title="Procurement"/>
                <NavMain items={financeItems} title="Finance"/>
                <NavMain items={reportItems} title="Reports"/>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
