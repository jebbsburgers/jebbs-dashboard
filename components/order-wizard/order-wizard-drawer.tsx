"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useBurgers, useExtras, useCustomers } from "@/lib/hooks/use-menu";
import { useCustomerAddresses } from "@/lib/hooks/use-customers";
import { useAllCombos } from "@/lib/hooks/use-combos";
import { cn } from "@/lib/utils";
import { EditCustomerModal } from "../orders/edit/edit-customer-modal";

import { useOrderWizard } from "./hooks/use-order-wizard";

import {
  CustomerStep,
  CombosStep,
  BurgersStep,
  SummaryStep,
} from "./steps/index";
import type { OrderWithItems } from "@/lib/types";

interface OrderWizardDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  orderToEdit?: OrderWithItems | null;
}

type WizardStep = "customer" | "combos" | "burgers" | "summary";

const CUSTOMERS_PER_PAGE = 5;

export function OrderWizardDrawer({
  open,
  onOpenChange,
  mode = "create",
  orderToEdit,
}: OrderWizardDrawerProps) {
  const [step, setStep] = useState<WizardStep>("customer");

  // Paginación de clientes
  const [customerPage, setCustomerPage] = useState(1);

  // ================= DATA LOADING =================
  const { data: customers } = useCustomers();
  const { data: burgers } = useBurgers();
  const { data: extras } = useExtras();
  const { data: combos } = useAllCombos();

  // ================= COMPUTED DATA =================
  const meatExtra = useMemo(
    () => extras?.find((e) => e.name === "Medallón"),
    [extras],
  );

  const friesExtra = useMemo(
    () => extras?.find((e) => e.name === "Papas fritas chicas"),
    [extras],
  );

  const extrasByCategory = useMemo(() => {
    if (!extras) return {};
    return extras.reduce(
      (acc, extra) => {
        if (!acc[extra.category]) acc[extra.category] = [];
        acc[extra.category].push(extra);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }, [extras]);

  const wizard = useOrderWizard({
    meatExtra,
    friesExtra,
    mode,
    orderToEdit,
    allBurgers: burgers || [],
    allCombos: combos || [],
    allExtras: extras || [],
  });

  // ================= CUSTOMER ADDRESSES =================
  const { data: customerAddresses, isLoading: isLoadingAddresses } =
    useCustomerAddresses(wizard.customer.selectedCustomer?.id);

  const selectedAddressObj = useMemo(() => {
    if (!customerAddresses || !wizard.customer.selectedAddress) return null;
    return customerAddresses.find(
      (addr) => addr.id === wizard.customer.selectedAddress,
    );
  }, [customerAddresses, wizard.customer.selectedAddress]);

  // ================= FILTERED CUSTOMERS =================
  const filteredCustomers = useMemo(() => {
    if (!customers || !wizard.customer.customerSearch) return customers || [];

    const search = wizard.customer.customerSearch.toLowerCase();

    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.phone?.includes(wizard.customer.customerSearch),
    );
  }, [customers, wizard.customer.customerSearch]);

  // Reset página cuando cambia la búsqueda
  useEffect(() => {
    setCustomerPage(1);
  }, [wizard.customer.customerSearch]);

  const customerTotalPages = Math.ceil(
    filteredCustomers.length / CUSTOMERS_PER_PAGE,
  );

  // ================= HANDLERS =================
  const handleClose = (open: boolean) => {
    if (!open) {
      wizard.resetAll();
      setStep("customer");
      setCustomerPage(1);
    }
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    await wizard.handleSubmit();
    handleClose(false);
  };

  const handleEditCustomer = () => {
    wizard.customer.setIsEditingCustomer(true);
  };

  // ================= STEP DEFINITIONS =================
  const steps = [
    { key: "customer", label: "Cliente" },
    { key: "combos", label: "Combos" },
    { key: "burgers", label: "Hamburguesas" },
    { key: "summary", label: "Resumen" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  // ================= RENDER =================
  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="right"
          className="flex h-full w-full max-w-2xl flex-col p-0 sm:max-w-2xl"
        >
          {/* HEADER */}
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle className="text-lg">
              {mode === "edit"
                ? `Editar Pedido #${orderToEdit?.order_number}`
                : "Crear Pedido"}
            </SheetTitle>

            <div className="flex items-center gap-2 pt-2">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                      step === s.key
                        ? "bg-primary text-primary-foreground"
                        : currentStepIndex > i
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {currentStepIndex > i ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="ml-2 text-sm">{s.label}</span>
                  {i < steps.length - 1 && (
                    <div className="mx-3 h-px w-8 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </SheetHeader>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {step === "customer" && (
                <CustomerStep
                  customerSearch={wizard.customer.customerSearch}
                  onCustomerSearchChange={wizard.customer.setCustomerSearch}
                  filteredCustomers={filteredCustomers}
                  selectedCustomer={wizard.customer.selectedCustomer}
                  onSelectCustomer={wizard.customer.setSelectedCustomer}
                  isNewCustomer={wizard.customer.isNewCustomer}
                  onToggleNewCustomer={wizard.customer.setIsNewCustomer}
                  newCustomerData={wizard.customer.newCustomerData}
                  onNewCustomerDataChange={wizard.customer.setNewCustomerData}
                  newAddressData={wizard.customer.newAddressData}
                  onNewAddressDataChange={wizard.customer.setNewAddressData}
                  selectedAddress={wizard.customer.selectedAddress}
                  onSelectAddress={wizard.customer.setSelectedAddress}
                  isLoadingAddresses={isLoadingAddresses}
                  onEditCustomer={handleEditCustomer}
                  mode={mode}
                  page={customerPage}
                  totalPages={customerTotalPages}
                />
              )}

              {step === "combos" && (
                <CombosStep
                  availableCombos={combos || []}
                  onAddCombo={wizard.combos.addCombo}
                  onRemoveCombo={wizard.combos.removeCombo}
                  selectedCombos={wizard.combos.selectedCombos}
                  availableBurgers={burgers || []}
                  getRemainingQuantity={wizard.combos.getRemainingQuantity}
                  canAddBurgerToSlot={wizard.combos.canAddBurgerToSlot}
                  onAddBurgerToSlot={wizard.combos.addBurgerToSlot}
                  onRemoveBurgerFromSlot={wizard.combos.removeBurgerFromSlot}
                  onIncreaseBurgerQty={wizard.combos.increaseBurgerQty}
                  onDecreaseBurgerQty={wizard.combos.decreaseBurgerQty}
                  onUpdateBurgerMeat={wizard.combos.updateBurgerMeat}
                  onUpdateBurgerFries={wizard.combos.updateComboBurgerFries}
                  onSelectExtraForSlot={wizard.combos.selectExtraForSlot}
                  onToggleBurgerIngredient={
                    wizard.combos.toggleComboBurgerIngredient
                  }
                  onToggleBurgerExtra={wizard.combos.toggleComboBurgerExtra}
                  onUpdateBurgerExtraQty={
                    wizard.combos.updateComboBurgerExtraQty
                  }
                  expandedBurgerId={wizard.combos.expandedBurgerId}
                  onToggleBurgerExpanded={wizard.combos.toggleBurgerExpanded}
                  meatExtra={meatExtra}
                  friesExtra={friesExtra}
                  extrasByCategory={extrasByCategory}
                />
              )}

              {step === "burgers" && (
                <BurgersStep
                  availableBurgers={burgers || []}
                  onAddBurger={wizard.burgers.addBurger}
                  selectedBurgers={wizard.burgers.selectedBurgers}
                  onRemoveBurger={wizard.burgers.removeBurger}
                  onUpdateQuantity={wizard.burgers.updateQuantity}
                  onToggleIngredient={wizard.burgers.toggleIngredient}
                  onUpdateMeatCount={wizard.burgers.updateMeatCount}
                  onUpdateFriesQuantity={wizard.burgers.updateFriesQuantity}
                  onToggleExtra={wizard.burgers.toggleExtra}
                  onUpdateExtraQuantity={wizard.burgers.updateExtraQuantity}
                  expandedBurger={wizard.burgers.expandedBurger}
                  onToggleExpanded={wizard.burgers.toggleExpanded}
                  meatExtra={meatExtra}
                  friesExtra={friesExtra}
                  extrasByCategory={extrasByCategory}
                />
              )}

              {step === "summary" && (
                <SummaryStep
                  isNewCustomer={wizard.customer.isNewCustomer}
                  customerName={
                    wizard.customer.selectedCustomer?.name ??
                    wizard.customer.newCustomerData.name
                  }
                  customerPhone={
                    wizard.customer.selectedCustomer?.phone ??
                    wizard.customer.newCustomerData.phone
                  }
                  selectedAddress={selectedAddressObj}
                  newAddressData={wizard.customer.newAddressData}
                  selectedBurgers={wizard.burgers.selectedBurgers}
                  selectedCombos={wizard.combos.selectedCombos}
                  subtotal={wizard.subtotal}
                  extrasTotal={wizard.extrasTotal}
                  orderTotal={wizard.orderTotal}
                  meatExtra={meatExtra}
                  friesExtra={friesExtra}
                  discountType={wizard.settings.discountType}
                  discountValue={wizard.settings.discountValue}
                  discountAmount={wizard.discountAmount}
                  onDiscountTypeChange={wizard.settings.setDiscountType}
                  onDiscountValueChange={wizard.settings.setDiscountValue}
                  deliveryType={wizard.settings.deliveryType}
                  onDeliveryTypeChange={wizard.settings.setDeliveryType}
                  deliveryFee={wizard.settings.deliveryFee}
                  onDeliveryFeeChange={wizard.settings.setDeliveryFee}
                  paymentMethod={wizard.settings.paymentMethod}
                  onPaymentMethodChange={wizard.settings.setPaymentMethod}
                  notes={wizard.settings.notes}
                  onNotesChange={wizard.settings.setNotes}
                  deliveryTime={wizard.settings.deliveryTime}
                  onDeliveryTimeChange={wizard.settings.setDeliveryTime}
                />
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="shrink-0 flex items-center justify-between border-t px-6 py-4 z-10 bg-background">
            {/* Back Button */}
            {step !== "customer" ? (
              <Button
                variant="outline"
                onClick={() => {
                  if (step === "combos") setStep("customer");
                  else if (step === "burgers") setStep("combos");
                  else if (step === "summary") setStep("burgers");
                }}
                className="bg-card"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
            ) : (
              <div />
            )}

            {/* Paginación de clientes (centro) */}
            {step === "customer" &&
              !wizard.customer.isNewCustomer &&
              customerTotalPages > 1 && (
                <div className="ios-glass rounded-full px-4 py-2 flex items-center gap-2 bg-card">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={customerPage === 1}
                    onClick={() => setCustomerPage((p) => p - 1)}
                  >
                    ←
                  </Button>
                  <span className="text-sm font-medium">
                    {customerPage} / {customerTotalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={customerPage === customerTotalPages}
                    onClick={() => setCustomerPage((p) => p + 1)}
                  >
                    →
                  </Button>
                </div>
              )}

            {/* Next/Submit Buttons */}
            {step === "customer" && (
              <Button
                onClick={() => setStep("combos")}
                disabled={!wizard.canProceedFromCustomer}
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === "combos" && (
              <Button
                onClick={() => setStep("burgers")}
                disabled={!wizard.canProceedFromCombos}
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === "burgers" && (
              <Button
                onClick={() => setStep("summary")}
                disabled={!wizard.canProceedFromBurgers}
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === "summary" && (
              <Button
                onClick={handleSubmit}
                disabled={!wizard.settings.deliveryType || wizard.isSubmitting}
              >
                {wizard.isSubmitting
                  ? mode === "edit"
                    ? "Guardando..."
                    : "Creando..."
                  : mode === "edit"
                    ? "Guardar cambios"
                    : "Crear pedido"}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {wizard.customer.selectedCustomer && (
        <EditCustomerModal
          open={wizard.customer.isEditingCustomer}
          onOpenChange={wizard.customer.setIsEditingCustomer}
          customer={wizard.customer.selectedCustomer}
        />
      )}
    </>
  );
}
