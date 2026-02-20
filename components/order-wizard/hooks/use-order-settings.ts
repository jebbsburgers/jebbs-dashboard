import { useState } from "react";

export function useOrderSettings() {
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    "pickup",
  );
  const [deliveryFee, setDeliveryFee] = useState(2000);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash",
  );
  const [notes, setNotes] = useState("");
  const [discountType, setDiscountType] = useState<
    "amount" | "percentage" | "none"
  >("none");
  const [discountValue, setDiscountValue] = useState(0);

  const reset = () => {
    setDeliveryType("pickup");
    setDeliveryFee(0);
    setPaymentMethod("cash");
    setNotes("");
    setDiscountType("none");
    setDiscountValue(0);
  };

  const loadSettings = (settings: {
    deliveryType: "delivery" | "pickup";
    deliveryFee: number;
    paymentMethod: "cash" | "transfer";
    discountType: "amount" | "percentage" | "none";
    discountValue: number;
    notes: string;
  }) => {
    setDeliveryType(settings.deliveryType);
    setDeliveryFee(settings.deliveryFee);
    setPaymentMethod(settings.paymentMethod);
    setDiscountType(settings.discountType);
    setDiscountValue(settings.discountValue);
    setNotes(settings.notes);
  };

  return {
    // Delivery
    deliveryType,
    setDeliveryType,
    deliveryFee,
    setDeliveryFee,

    // Payment
    paymentMethod,
    setPaymentMethod,

    // Notes
    notes,
    setNotes,

    // 🆕 Discounts
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,

    loadSettings,

    // Actions
    reset,
  };
}
