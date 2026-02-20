import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerAddresses } from "@/lib/hooks/use-customers";

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
  onChange: (addressId: string) => void;
  isLoading: boolean;
}) {
  const { data: addresses } = useCustomerAddresses(customerId);

  // 1️⃣ Loading visual controlado desde el padre
  if (isLoading) {
    return <Skeleton className="h-3 w-40" />;
  }

  // 2️⃣ Sin direcciones (solo cuando YA terminó de cargar)
  if (!addresses || addresses.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No tiene direcciones guardadas
      </p>
    );
  }

  const selectedAddress = addresses?.find((a) => a.id === value);
  const hasNotes = !!selectedAddress?.notes;

  console.log(hasNotes);

  // 3️⃣ Select normal
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
