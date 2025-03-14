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
    BookUser,
    Truck,
    Warehouse,
    Ticket,
    ScrollText,
    ClipboardList,
    PackageCheck, Receipt, ArrowDown, TrendingUp, Box, Banknote
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
            url: '/master/customers',
            icon: BookUser,
        },
        hasPermission('read_supplier') && {
            title: 'Suppliers',
            url: '/master/suppliers',
            icon: Truck
        }
    ].filter(Boolean) as NavItem[];

    const inventoryAndStockItems: NavItemWithChildren[] = [
        {
            title: 'Inventory',
            url: '/inventory',
            icon: Warehouse,
            matchPatch: ['/inventory', '/inventory/*']
        },
        {
            title: 'Stock Management',
            url: '',
            icon: ClipboardList,
            children: [
                {
                    title: 'Audit',
                    url: '/stock/audit',
                    matchPatch: ['/stock/audit', '/stock/audit/*', '/stock/audit?*']
                },
                {
                    title: 'Adjustment',
                    url: '/stock/adjustment',
                },
                {
                    title: 'Transfer',
                    url: '/stock/transfer',
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

    const salesItems: NavItemWithChildren[] = [
        {
            title: 'Sales Orders',
            url: '/sales/orders',
            icon: Ticket,
        },
        {
            title: 'Waybill',
            url: '/sales/waybills',
            icon: ScrollText,
        },
        {
            title: 'Receivables',
            url: '',
            icon: Banknote,
            children: [
                {
                    title: 'Invoice',
                    url: '/sales/invoices',
                },
                {
                    title: 'Payments',
                    url: '/sales/payments',
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
            title: 'inventory Movement',
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
                { ((hasPermission('read_item_category') || hasPermission('read_item_unit')) || hasPermission('read_item')) && (
                    <NavMainWithSubmenu items={inventoryAndStockItems} title="Inventory & Stock"/>
                )}
                <NavMainWithSubmenu items={procurementItems} title="Procurement"/>
                <NavMainWithSubmenu items={salesItems} title="Sales"/>
                <NavMain items={financeItems} title="Finance"/>
                <NavMain items={reportItems} title="Reports"/>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
