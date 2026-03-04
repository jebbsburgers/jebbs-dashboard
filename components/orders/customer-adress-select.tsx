import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerAddresses } from "@/lib/hooks/use-customers";
import { useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CustomerAddressSelect({
  customerId,
  value,
  onChange,
  isLoading,
}: {
  customerId: string;
  value?: string;
  onChange: (addressId: string | undefined) => void;
  isLoading: boolean;
}) {
  const { data: addresses } = useCustomerAddresses(customerId);

  // Auto-select default address when:
  // 1. Addresses load for the first time (value is empty)
  // 2. Customer changes and current value belongs to the previous customer
  useEffect(() => {
    if (!addresses || addresses.length === 0) return;
    const belongsToCurrent = addresses.some((a) => a.id === value);
    if (belongsToCurrent) return;
    const defaultAddr = addresses.find((a) => a.is_default) ?? addresses[0];
    onChange(defaultAddr.id);
  }, [addresses, customerId]);

  if (isLoading) {
    return <Skeleton className="h-3 w-40" />;
  }

  if (!addresses || addresses.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No tiene direcciones guardadas
      </p>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === value);
  const hasNotes = !!selectedAddress?.notes;

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-55">
          <SelectValue placeholder="Seleccionar dirección" />
        </SelectTrigger>

        <SelectContent>
          {addresses.map((addr) => (
            <SelectItem key={addr.id} value={addr.id}>
              {addr.label ? `${addr.label} – ` : ""}
              {addr.address}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasNotes && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer text-muted-foreground text-sm">
                🛈
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">
                Nota de la dirección: {selectedAddress?.notes}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}