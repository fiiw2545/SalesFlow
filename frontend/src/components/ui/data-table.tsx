import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import EmptyState from "./empty-state";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

function DataTable<T>({
  columns,
  data,
  getRowKey,
  loading = false,
  emptyTitle = "No data found",
  emptyDescription = "There is no information to display yet.",
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <LoaderCircle size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-max text-left text-sm font-normal leading-5">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  px-5 py-3 text-xs font-semibold leading-4
                  text-slate-600
                  ${column.className ?? ""}
                `}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.map((row) => (
            <tr
              key={getRowKey(row)}
              className="transition-colors hover:bg-slate-50"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`
                    px-5 py-4 text-sm font-normal leading-5
                    text-slate-700
                    ${column.className ?? ""}
                  `}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
