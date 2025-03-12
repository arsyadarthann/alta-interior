import { type ColumnDef } from "@tanstack/react-table";

export function createNumberColumn<TData>(): ColumnDef<TData> {
    return {
        id: "#",
        header: () => <div className="text-center">#</div>,
        cell: ({ row }) => {
            return (
                <div className="text-center">
                    {row.index + 1}
                </div>
            );
        },
    };
}
