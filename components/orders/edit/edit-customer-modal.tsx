import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Customer } from "@/lib/types";
import { useCustomerAddresses } from "@/lib/hooks/use-customers";
import { CustomerAddressesEditor } from "./customer-adresses-editor";

export function EditCustomerModal({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: Customer;
}) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [selectedAddress, setSelectedAddress] = useState<any>();

  const {
    data: addresses = [],
    isLoading,
    isFetching,
  } = useCustomerAddresses(customer.id);

  // 👉 set default automáticamente
  useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      setSelectedAddress(addresses.find((a) => a.is_default) ?? addresses[0]);
    }
  }, [addresses, selectedAddress]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">Nombre</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-card"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm">Teléfono</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-card"
            />
          </div>

          <CustomerAddressesEditor
            customerId={customer.id}
            addresses={addresses}
            isLoading={isLoading || isFetching}
            selectedAddressId={selectedAddress?.id}
            onSelect={setSelectedAddress}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
