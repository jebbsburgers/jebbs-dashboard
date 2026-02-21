import { DiscountType, PaymentMethod } from "@/lib/types";
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
  const [deliveryTime, setDeliveryTime] = useState(""); // 🆕 Horario de entrega

  const reset = () => {
    setDeliveryType("delivery");
    setDeliveryFee(2000);
    setPaymentMethod("transfer");
    setDiscountType("none");
    setDiscountValue(0);
    setNotes("");
    setDeliveryTime(""); // 🆕
  };

  const loadSettings = (settings: {
    deliveryType: DeliveryType;
    deliveryFee: number;
    paymentMethod: PaymentMethod;
    discountType: DiscountType;
    discountValue: number;
    notes: string;
    deliveryTime?: string; // 🆕
  }) => {
    setDeliveryType(settings.deliveryType);
    setDeliveryFee(settings.deliveryFee);
    setPaymentMethod(settings.paymentMethod);
    setDiscountType(settings.discountType);
    setDiscountValue(settings.discountValue);
    setNotes(settings.notes);
    setDeliveryTime(settings.deliveryTime || ""); // 🆕
  };

  return {
    deliveryType,
    setDeliveryType,
    deliveryFee,
    setDeliveryFee,
    paymentMethod,
    setPaymentMethod,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    notes,
    setNotes,
    deliveryTime, // 🆕
    setDeliveryTime, // 🆕
    reset,
    loadSettings,
  };
}
