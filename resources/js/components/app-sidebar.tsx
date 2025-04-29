import { NavMainWithSubmenu } from '@/components/nav-group';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { usePermissions } from '@/hooks/use-permissions';
import { type NavItem, NavItemWithChildren } from '@/types';
import { Link } from '@inertiajs/react';
import {
    ArrowDown,
    Banknote,
    BookUser,
    Box,
    ClipboardList,
    LayoutGrid,
    PackageCheck,
    Receipt,
    ScrollText,
    Ticket,
    TrendingUp,
    Truck,
    Warehouse,
} from 'lucide-react';
import AppLogo from './app-logo';

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
            icon: Truck,
        },
    ].filter(Boolean) as NavItem[];

    const inventoryAndStockItems: NavItemWithChildren[] = [
        ...(hasPermission('read_item_category') || hasPermission('read_item_unit') || hasPermission('read_item')
            ? [
                  {
                      title: 'Inventory',
                      url: '/inventory',
                      icon: Warehouse,
                      matchPatch: ['/inventory', '/inventory/*'],
                  },
              ]
            : []),
        {
            title: 'Stock Management',
            url: '',
            icon: ClipboardList,
            children: [
                ...(hasPermission('read_stock_audit')
                    ? [
                          {
                              title: 'Audit',
                              url: '/stock/audit',
                              matchPatch: ['/stock/audit', '/stock/audit/*', '/stock/audit?*'],
                          },
                      ]
                    : []),
                ...(hasPermission('read_stock_adjustment')
                    ? [
                          {
                              title: 'Adjustment',
                              url: '/stock/adjustment',
                              matchPatch: ['/stock/adjustment', '/stock/adjustment/*', '/stock/adjustment?*'],
                          },
                      ]
                    : []),
                ...(hasPermission('read_stock_transfer')
                    ? [
                          {
                              title: 'Transfer',
                              url: '/stock/transfer',
                              matchPatch: ['/stock/transfer', '/stock/transfer/*', '/stock/transfer?*'],
                          },
                      ]
                    : []),
            ].filter((item) => item !== undefined),
        },
    ].filter((item) => {
        if (item.title === 'Stock Management') {
            return item.children && item.children.length > 0;
        }
        return true;
    });

    const procurementItems: NavItemWithChildren[] = [
        ...(hasPermission('read_purchase_order')
            ? [
                  {
                      title: 'Purchase Orders',
                      url: '/procurement/orders',
                      icon: ClipboardList,
                  },
              ]
            : []),

        ...(hasPermission('read_goods_receipt')
            ? [
                  {
                      title: 'Goods Receipts',
                      url: '/procurement/receipts',
                      icon: PackageCheck,
                  },
              ]
            : []),

        ...(hasPermission('read_purchase_invoice') || hasPermission('read_purchase_invoice_payment')
            ? [
                  {
                      title: 'Payables',
                      url: '',
                      icon: Receipt,
                      children: [
                          ...(hasPermission('read_purchase_invoice')
                              ? [
                                    {
                                        title: 'Supplier Invoice',
                                        url: '/procurement/invoices',
                                    },
                                ]
                              : []),

                          ...(hasPermission('read_purchase_invoice_payment')
                              ? [
                                    {
                                        title: 'Payments',
                                        url: '/procurement/payments',
                                    },
                                ]
                              : []),
                      ].filter((item) => item !== undefined),
                  },
              ]
            : []),
    ].filter((item) => {
        if (item.title === 'Payables') {
            return item.children && item.children.length > 0;
        }
        return true;
    });

    const salesItems: NavItemWithChildren[] = [
        ...(hasPermission('read_sales_order')
            ? [
                  {
                      title: 'Sales Orders',
                      url: '/sales/orders',
                      icon: Ticket,
                  },
              ]
            : []),

        ...(hasPermission('read_waybill')
            ? [
                  {
                      title: 'Waybill',
                      url: '/sales/waybills',
                      icon: ScrollText,
                  },
              ]
            : []),

        ...(hasPermission('read_sales_invoice') || hasPermission('read_sales_invoice_payment')
            ? [
                  {
                      title: 'Receivables',
                      url: '',
                      icon: Banknote,
                      children: [
                          ...(hasPermission('read_sales_invoice')
                              ? [
                                    {
                                        title: 'Invoice',
                                        url: '/sales/invoices',
                                    },
                                ]
                              : []),

                          ...(hasPermission('read_sales_invoice_payment')
                              ? [
                                    {
                                        title: 'Payments',
                                        url: '/sales/payments',
                                    },
                                ]
                              : []),
                      ].filter((item) => item !== undefined),
                  },
              ]
            : []),
    ].filter((item) => {
        if (item.title === 'Receivables') {
            return item.children && item.children.length > 0;
        }
        return true;
    });

    const financeItems: NavItem[] = [
        {
            title: 'Expenses',
            url: '/expenses',
            icon: ArrowDown,
        },
    ];

    const reportItems: NavItemWithChildren[] = [
        {
            title: 'Sales',
            url: '/reports/sales',
            icon: TrendingUp,
        },
        {
            title: 'Transaction',
            url: '/reports/transactions',
            icon: Receipt,
        },
        {
            title: 'Stock Movement',
            url: '/reports/stock-movements',
            icon: Box,
            matchPatch: ['/reports/stock-movements', '/reports/stock-movements?*'],
        },
    ];

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
                <NavMain items={mainNavItems} title="Dashboard" />
                {(hasPermission('read_customer') || hasPermission('read_supplier')) && (
                    <NavMain items={customersAndSuppliersItems} title="Customers & Suppliers" />
                )}
                {(hasPermission('read_item_category') ||
                    hasPermission('read_item_unit') ||
                    hasPermission('read_item') ||
                    hasPermission('read_stock_audit') ||
                    hasPermission('read_stock_adjustment') ||
                    hasPermission('read_stock_transfer')) && <NavMainWithSubmenu items={inventoryAndStockItems} title="Inventory & Stock" />}
                {(hasPermission('read_purchase_order') ||
                    hasPermission('read_goods_receipt') ||
                    hasPermission('read_purchase_invoice') ||
                    hasPermission('read_purchase_invoice_payments')) && <NavMainWithSubmenu items={procurementItems} title="Procurement" />}
                <NavMainWithSubmenu items={salesItems} title="Sales" />
                <NavMain items={financeItems} title="Finance" />
                <NavMainWithSubmenu items={reportItems} title="Reports" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
