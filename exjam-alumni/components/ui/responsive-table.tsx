import { useMobile } from "@/hooks/use-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

interface ResponsiveTableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    label: string;
    mobileLabel?: string;
    render?: (value: any, item: T) => React.ReactNode;
    className?: string;
    mobileHidden?: boolean;
  }[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
}

export function ResponsiveTable<T>({
  data,
  columns,
  onRowClick,
  keyExtractor,
}: ResponsiveTableProps<T>) {
  const { isMobile } = useMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item) => (
          <Card
            key={keyExtractor(item)}
            className={onRowClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                {columns
                  .filter((col) => !col.mobileHidden)
                  .map((col) => (
                    <div key={String(col.key)} className="flex items-start justify-between">
                      <span className="text-sm text-muted-foreground">
                        {col.mobileLabel || col.label}
                      </span>
                      <span className="ml-2 text-right text-sm font-medium">
                        {col.render ? col.render(item[col.key], item) : String(item[col.key])}
                      </span>
                    </div>
                  ))}
              </div>
              {onRowClick && (
                <div className="mt-3 flex justify-end">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={String(col.key)} className={col.className}>
              {col.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow
            key={keyExtractor(item)}
            className={onRowClick ? "cursor-pointer" : ""}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((col) => (
              <TableCell key={String(col.key)} className={col.className}>
                {col.render ? col.render(item[col.key], item) : String(item[col.key])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
