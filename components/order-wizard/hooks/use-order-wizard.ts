import { useMemo, useEffect } from "react";
import { useCustomerSelection } from "./use-customer-selection";
import { useBurgerSelection } from "./use-burger-selection";
import { useComboSelection } from "./use-combo-selection";
import { useOrderSettings } from "./use-order-settings";
import { OrderPriceCalculator } from "../services/order-price-calculator";
import { OrderDataTransformer } from "../services/order-data-transformer";
import { usePrintOrder } from "@/lib/hooks/use-print-order";
import {
  useCreateOrder,
  type OrderItemInput,
} from "@/lib/hooks/orders/use-create-order";
import {
  useCreateCustomer,
  useCreateCustomerAddress,
} from "@/lib/hooks/use-customers";
import type { Extra, OrderWithItems } from "@/lib/types"; // 🆕
import { loadOrderIntoWizard } from "@/services/order-data-loader";
import { useUpdateOrder } from "@/lib/hooks/orders/use-update-order";

interface UseOrderWizardParams {
  meatExtra?: { price: number } | null;
  friesExtra?: { price: number } | null;
  mode?: "create" | "edit"; // 🆕
  orderToEdit?: OrderWithItems | null; // 🆕
  allBurgers?: any[]; // 🆕
  allCombos?: any[]; // 🆕
  allExtras?: Extra[]; // 🆕
}

export function useOrderWizard({
  meatExtra,
  friesExtra,
  mode = "create", // 🆕
  orderToEdit, // 🆕
  allBurgers = [], // 🆕
  allCombos = [], // 🆕
  allExtras = [], // 🆕
}: UseOrderWizardParams) {
  // ================= HOOKS =================
  const customer = useCustomerSelection();
  const burgers = useBurgerSelection(meatExtra);
  const combos = useComboSelection();
  const settings = useOrderSettings();
  const printOrder = usePrintOrder();

  // API Mutations
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder(); // 🆕
  const createCustomer = useCreateCustomer();
  const createCustomerAddress = useCreateCustomerAddress();

  // ================= COMPUTED =================

  const subtotal = useMemo(() => {
    return OrderPriceCalculator.calculateSubtotal(
      burgers.selectedBurgers,
      combos.selectedCombos,
      meatExtra,
      friesExtra,
    );
  }, [burgers.selectedBurgers, combos.selectedCombos, meatExtra, friesExtra]);

  const discountAmount = useMemo(() => {
    return OrderPriceCalculator.calculateDiscountAmount(
      subtotal,
      settings.discountType,
      settings.discountValue,
    );
  }, [subtotal, settings.discountType, settings.discountValue]);

  const orderTotal = useMemo(() => {
    return OrderPriceCalculator.calculateOrderTotal({
      selectedBurgers: burgers.selectedBurgers,
      selectedCombos: combos.selectedCombos,
      deliveryType: settings.deliveryType,
      deliveryFee: settings.deliveryFee,
      meatExtra,
      friesExtra,
      discountType: settings.discountType,
      discountValue: settings.discountValue,
    });
  }, [
    burgers.selectedBurgers,
    combos.selectedCombos,
    settings.deliveryType,
    settings.deliveryFee,
    meatExtra,
    friesExtra,
    settings.discountType,
    settings.discountValue,
  ]);

  const extrasTotal = useMemo(() => {
    return OrderPriceCalculator.calculateExtrasTotal(burgers.selectedBurgers);
  }, [burgers.selectedBurgers]);

  const canProceedFromCustomer = customer.canProceed;

  const canProceedFromBurgers =
    burgers.selectedBurgers.length > 0 || combos.selectedCombos.length > 0;

  const canProceedFromCombos = useMemo(() => {
    if (combos.selectedCombos.length === 0) return true;

    return combos.selectedCombos.every((combo) => {
      return combo.slots.every((slot) => {
        const isRequired = slot.minQuantity > 0;

        if (!isRequired) return true;

        // 🍔 Validar slots de burgers
        if (slot.slotType === "burger") {
          const totalQty = slot.burgers.reduce((acc, b) => acc + b.quantity, 0);
          return totalQty >= slot.minQuantity;
        }

        // 🥤🍟 Validar slots de bebidas, sides y nuggets
        if (
          slot.slotType === "drink" ||
          slot.slotType === "side" ||
          slot.slotType === "nuggets"
        ) {
          return slot.selectedExtra !== null;
        }

        return true;
      });
    });
  }, [combos.selectedCombos]);

  // ================= 🆕 LOAD DATA IN EDIT MODE =================

  useEffect(() => {
    if (mode === "edit" && orderToEdit) {
      console.log("🔄 Cargando pedido para editar:", orderToEdit);

      const wizardData = loadOrderIntoWizard(
        orderToEdit,
        allExtras,
        allBurgers,
        allCombos,
      );

      // Cargar datos en cada módulo
      customer.loadCustomerData(wizardData.customerData);
      burgers.loadBurgers(wizardData.burgers);
      combos.loadCombos(wizardData.combos);
      settings.loadSettings(wizardData.settings);

      console.log("✅ Datos cargados en wizard");
    }
  }, [mode, orderToEdit]); // Solo ejecutar cuando cambie mode o orderToEdit

  // ================= ACTIONS =================

  const handleSubmit = async () => {
    try {
      console.log("=== INICIO DE SUBMIT ===");
      console.log("Modo:", mode);
      console.log("Burgers:", burgers.selectedBurgers);
      console.log("Combos:", combos.selectedCombos);

      // 1️⃣ Transform data
      const items: OrderItemInput[] =
        OrderDataTransformer.transformToOrderPayload(
          burgers.selectedBurgers,
          combos.selectedCombos,
          meatExtra,
          friesExtra,
        );

      console.log("Items transformados:", items);

      if (!items || items.length === 0) {
        throw new Error("No hay items en el pedido");
      }

      let customerId = customer.selectedCustomer?.id;
      let customerAddressId = customer.selectedAddress;

      console.log("Customer ID:", customerId);
      console.log("Address ID:", customerAddressId);

      // 2️⃣ Create customer if needed (solo en modo create)
      if (!customerId && mode === "create") {
        console.log("Creando nuevo customer...");
        const newCustomer = await createCustomer.mutateAsync({
          name: customer.newCustomerData.name,
          phone: customer.newCustomerData.phone,
        });

        customerId = newCustomer.id;
        console.log("Nuevo customer creado:", customerId);
      }

      // 3️⃣ Create address if needed (solo en modo create)
      if (
        !customerAddressId &&
        settings.deliveryType === "delivery" &&
        mode === "create"
      ) {
        if (!customerId) {
          throw new Error("Customer ID is required to create address");
        }

        console.log("Creando nueva dirección...");
        const address = await createCustomerAddress.mutateAsync({
          customerId,
          address: customer.newAddressData.address,
          label: customer.newAddressData.label ?? "Principal",
          notes: customer.newAddressData.notes,
          is_default: true,
        });

        customerAddressId = address.id;
        console.log("Nueva dirección creada:", customerAddressId);
      }

      // 4️⃣ Preparar payload
      const orderPayload = {
        customer_id: customerId ?? null, // 🆕 Convertir undefined → null
        customer_name:
          customer.selectedCustomer?.name ?? customer.newCustomerData.name,
        customer_address_id: customerAddressId ?? null, // 🆕 Convertir undefined → null
        delivery_type: settings.deliveryType,
        delivery_fee:
          settings.deliveryType === "delivery" ? settings.deliveryFee : 0,
        payment_method: settings.paymentMethod,
        discount_type: settings.discountType,
        discount_value: settings.discountValue,
        discount_amount: discountAmount,
        items,
        notes: settings.notes || null, // 🆕 Convertir "" o undefined → null
      };

      console.log("=== PAYLOAD FINAL ===");
      console.log(JSON.stringify(orderPayload, null, 2));

      // 5️⃣ CREATE o UPDATE según modo
      let orderId: string;

      if (mode === "edit" && orderToEdit) {
        // 🆕 MODO EDIT: Actualizar pedido existente
        console.log("🔄 Actualizando pedido existente:", orderToEdit.id);
        const updated = await updateOrder.mutateAsync({
          orderId: orderToEdit.id,
          payload: orderPayload,
        });
        orderId = updated.id;
      } else {
        // MODO CREATE: Crear nuevo pedido
        console.log("🆕 Creando nuevo pedido");
        const created = await createOrder.mutateAsync(orderPayload);
        orderId = created.id;
      }

      // 🔥 Imprimir automáticamente
      await printOrder.mutateAsync(orderId);

      console.log("=== ORDEN PROCESADA EXITOSAMENTE ===");
    } catch (error) {
      console.error("=== ERROR EN SUBMIT ===");
      console.error(error);
      throw error;
    }
  };

  const resetAll = () => {
    customer.reset();
    burgers.reset();
    combos.resetState();
    settings.reset();
  };

  // ================= RETURN =================

  return {
    // State modules
    customer,
    burgers,
    combos,
    settings,

    // Computed
    subtotal,
    orderTotal,
    extrasTotal,
    discountAmount,
    canProceedFromCustomer,
    canProceedFromBurgers,
    canProceedFromCombos,

    // Actions
    handleSubmit,
    resetAll,

    // Mutation states
    isSubmitting:
      mode === "edit" ? updateOrder.isPending : createOrder.isPending, // 🆕
    isCreatingCustomer: createCustomer.isPending,
    isCreatingAddress: createCustomerAddress.isPending,

    // 🆕 Info de modo
    mode,
    orderToEdit,
  };
}
