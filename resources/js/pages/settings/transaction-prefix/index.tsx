import { Head, useForm } from "@inertiajs/react";
import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/hooks/use-toast';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HeadingSmall from '@/components/heading-small';
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Save } from "lucide-react";

interface TransactionPrefix {
    id: number;
    transaction_type: string;
    prefix_code: string;
}

interface Props {
    transactionPrefixes: TransactionPrefix[];
}

export default function Index({ transactionPrefixes }: Props) {
    const { toast } = useToast();
    const { data, setData, put, processing } = useForm({
        prefixes: transactionPrefixes.map((prefix) => ({
            id: prefix.id,
            prefix_code: prefix.prefix_code,
        })),
    });

    const [formChanged, setFormChanged] = useState(false);

    useEffect(() => {

        setFormChanged(false);
    }, [transactionPrefixes]);

    const middleIndex = Math.ceil(transactionPrefixes.length / 2);
    const leftColumnPrefixes = transactionPrefixes.slice(0, middleIndex);
    const rightColumnPrefixes = transactionPrefixes.slice(middleIndex);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("transaction-prefix.update"), {
            onSuccess: () => {
                toast({
                    variant: "success",
                    title: "Transaction Prefixes Updated",
                    description: "Your changes have been saved successfully.",
                });
                setFormChanged(false);
            },
        });
    };

    const handlePrefixChange = (index: number, value: string) => {
        const newPrefixes = [...data.prefixes];
        newPrefixes[index].prefix_code = value;
        setData("prefixes", newPrefixes);
        setFormChanged(true);
    };

    const PrefixTable = ({ prefixes }: { prefixes: TransactionPrefix[] }) => (
        <Card>
            <CardContent className="p-0">
                <div className="rounded-md overflow-hidden">
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border-b">
                        <div className="font-medium text-sm text-gray-600">Transaction Type</div>
                        <div className="font-medium text-sm text-gray-600">Prefix Code</div>
                    </div>

                    <div className="divide-y">
                        {prefixes.map((prefix) => {
                            const originalIndex = transactionPrefixes.findIndex(p => p.id === prefix.id);
                            const originalPrefix = transactionPrefixes[originalIndex]?.prefix_code;
                            const currentPrefix = data.prefixes[originalIndex]?.prefix_code || "";
                            const hasChanged = originalPrefix !== currentPrefix;

                            return (
                                <div key={prefix.id} className="grid grid-cols-2 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                                    <div className="font-medium text-sm flex items-center gap-2">
                                        {prefix.transaction_type}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="w-60">Prefix for {prefix.transaction_type} document numbers</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={currentPrefix}
                                            onChange={(e) => handlePrefixChange(originalIndex, e.target.value)}
                                            className={`max-w-[180px] ${hasChanged ? 'border-primary' : ''}`}
                                            maxLength={10}
                                            placeholder="Enter prefix"
                                        />
                                        {hasChanged && (
                                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                                Modified
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaction Prefixes" />
            <SettingsLayout fullWidth>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <HeadingSmall
                            title="Transaction Prefixes"
                            description="Configure document number prefixes for various transaction types."
                        />

                        <Button
                            onClick={handleSubmit}
                            disabled={processing || !formChanged}
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>

                    <div className="p-4 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-100">
                        You can customize the prefix codes for each transaction type. Changes will be reflected in new document numbers.
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <PrefixTable prefixes={leftColumnPrefixes} />
                            </div>

                            <div>
                                <PrefixTable prefixes={rightColumnPrefixes} />
                            </div>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaction Prefix',
        href: route('transaction-prefix.index'),
    }
];
