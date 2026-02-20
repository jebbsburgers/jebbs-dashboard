import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/types";
import { CustomerAddressSelect } from "@/components/orders/customer-adress-select";

interface CustomerStepProps {
  // Search & Selection
  customerSearch: string;
  onCustomerSearchChange: (value: string) => void;
  filteredCustomers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;

  // New vs Existing
  isNewCustomer: boolean;
  onToggleNewCustomer: (isNew: boolean) => void;

  // New Customer Data
  newCustomerData: { name: string; phone: string };
  onNewCustomerDataChange: (data: { name: string; phone: string }) => void;

  // New Address Data
  newAddressData: { label: string; address: string; notes: string };
  onNewAddressDataChange: (data: {
    label: string;
    address: string;
    notes: string;
  }) => void;

  // Address Selection
  selectedAddress?: string;
  onSelectAddress: (addressId: string | undefined) => void;
  isLoadingAddresses: boolean;

  // Edit Customer
  onEditCustomer: () => void;
}

export function CustomerStep({
  customerSearch,
  onCustomerSearchChange,
  filteredCustomers,
  selectedCustomer,
  onSelectCustomer,
  isNewCustomer,
  onToggleNewCustomer,
  newCustomerData,
  onNewCustomerDataChange,
  newAddressData,
  onNewAddressDataChange,
  selectedAddress,
  onSelectAddress,
  isLoadingAddresses,
  onEditCustomer,
}: CustomerStepProps) {
  return (
    <div className="space-y-4">
      {/* Toggle New/Existing */}
      <div className="flex gap-2">
        <Button
          variant={!isNewCustomer ? "default" : "outline"}
          className="flex-1"
          onClick={() => onToggleNewCustomer(false)}
        >
          <User className="mr-2 h-4 w-4" />
          Existente
        </Button>
        <Button
          variant={isNewCustomer ? "default" : "outline"}
          className="flex-1"
          onClick={() => onToggleNewCustomer(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {/* Existing Customer */}
      {!isNewCustomer ? (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o dirección..."
              value={customerSearch}
              onChange={(e) => onCustomerSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4">
            {filteredCustomers.slice(0, 10).map((customer) => {
              const isSelected = selectedCustomer?.id === customer.id;

              return (
                <Card
                  key={customer.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-sm",
                    isSelected && "ring-2 ring-primary",
                  )}
                  onClick={() => onSelectCustomer(customer)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-medium">Nombre: {customer.name}</p>

                      {isSelected && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCustomer();
                          }}
                        >
                          ✏️ Editar
                        </Button>
                      )}
                    </div>

                    {customer.phone && (
                      <p className="text-sm text-muted-foreground">
                        Teléfono: {customer.phone}
                      </p>
                    )}

                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          Direcciones:
                        </p>
                        <CustomerAddressSelect
                          customerId={customer.id}
                          value={selectedAddress}
                          onChange={onSelectAddress}
                          isLoading={isLoadingAddresses}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* New Customer */
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input
              value={newCustomerData.name}
              onChange={(e) =>
                onNewCustomerDataChange({
                  ...newCustomerData,
                  name: e.target.value,
                })
              }
              placeholder="Ej: Jeremías"
            />
          </div>

          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input
              value={newCustomerData.phone}
              onChange={(e) =>
                onNewCustomerDataChange({
                  ...newCustomerData,
                  phone: e.target.value,
                })
              }
              placeholder="Ej: 221 123-456"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Nombre de la dirección</Label>
            <Input
              value={newAddressData.label}
              onChange={(e) =>
                onNewAddressDataChange({
                  ...newAddressData,
                  label: e.target.value,
                })
              }
              placeholder="Ej: Casa"
            />
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              value={newAddressData.address}
              onChange={(e) =>
                onNewAddressDataChange({
                  ...newAddressData,
                  address: e.target.value,
                })
              }
              placeholder="Solo completar si es para envío a domicilio"
            />
          </div>

          <div className="space-y-2">
            <Label>Notas de la dirección</Label>
            <Textarea
              value={newAddressData.notes}
              onChange={(e) =>
                onNewAddressDataChange({
                  ...newAddressData,
                  notes: e.target.value,
                })
              }
              rows={2}
              className="bg-white"
              placeholder="Solo completar si es para envío a domicilio"
            />
          </div>
        </div>
      )}
    </div>
  );
}
