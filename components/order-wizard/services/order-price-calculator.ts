import { SelectedBurger } from "@/lib/types/combo-types";

interface SelectedComboSlot {
  slotId: string;
  slotType: "burger" | "drink" | "side" | "nuggets"; // 🆕 Agregar nuggets
  maxQuantity: number;
  defaultMeatCount?: number;
  burgers: SelectedBurger[];
  selectedExtra?: {
    // 🆕 Agregar selectedExtra
    id: string;
    name: string;
    price: number;
  } | null;
}

interface SelectedCombo {
  id: string;
  combo: { id: string; name: string; price: number };
  quantity: number;
  slots: SelectedComboSlot[];
}

interface PriceCalculatorParams {
  selectedBurgers: SelectedBurger[];
  selectedCombos: SelectedCombo[];
  deliveryType: "delivery" | "pickup";
  deliveryFee: number;
  meatExtra?: { price: number } | null;
  friesExtra?: { price: number } | null;
  discountType?: "amount" | "percentage" | "none";
  discountValue?: number;
}

export class OrderPriceCalculator {
  static calculateBurgersTotal(
    burgers: SelectedBurger[],
    friesExtra?: { price: number } | null,
  ): number {
    return burgers.reduce((total, item) => {
      const burgerTotal =
        (item.burger.base_price + item.meatPriceAdjustment) * item.quantity;

      const extrasTotal = item.selectedExtras.reduce(
        (acc, ext) => acc + ext.extra.price * ext.quantity,
        0,
      );

      let friesTotal = 0;
      if (friesExtra) {
        const baseFries = item.burger.default_fries_quantity ?? 1;
        const friesDiff = item.friesQuantity - baseFries;
        friesTotal = friesDiff * friesExtra.price * item.quantity;
      }

      return total + burgerTotal + extrasTotal + friesTotal;
    }, 0);
  }

  static calculateCombosTotal(
    combos: SelectedCombo[],
    meatExtra?: { price: number } | null,
    friesExtra?: { price: number } | null,
  ): number {
    return combos.reduce((comboAcc, c) => {
      // 🆕 Guard: si combo.price es null/undefined, usar 0
      const comboBasePrice = (c.combo?.price ?? 0) * c.quantity;

      const comboExtrasAndMore = c.slots.reduce((slotAcc, slot) => {
        const slotTotal = slot.burgers.reduce((burgerAcc, burger) => {
          const burgerExtras = burger.selectedExtras.reduce(
            (extAcc, ext) => extAcc + (ext.extra?.price ?? 0) * ext.quantity,
            0,
          );

          let meatAdjustment = 0;
          if (meatExtra) {
            const referenceMeatCount =
              slot.defaultMeatCount ?? burger.burger.default_meat_quantity ?? 2;
            const meatDiff = burger.meatCount - referenceMeatCount;
            meatAdjustment = meatDiff * meatExtra.price;
          }

          let friesAdjustment = 0;
          if (friesExtra) {
            const referenceFriesCount =
              burger.burger.default_fries_quantity ?? 1;
            const friesDiff = burger.friesQuantity - referenceFriesCount;
            friesAdjustment = friesDiff * friesExtra.price;
          }

          return (
            burgerAcc +
            (burgerExtras + meatAdjustment + friesAdjustment) * burger.quantity
          );
        }, 0);

        // 🆕 Agregar precio de selectedExtra si existe
        let selectedExtraPrice = 0;
        if (slot.selectedExtra && slot.selectedExtra.price > 0) {
          selectedExtraPrice = slot.selectedExtra.price;
        }

        return slotAcc + slotTotal + selectedExtraPrice;
      }, 0);

      return comboAcc + comboBasePrice + comboExtrasAndMore;
    }, 0);
  }

  static calculateExtrasTotal(burgers: SelectedBurger[]): number {
    return burgers.reduce((total, item) => {
      const itemExtrasTotal = item.selectedExtras.reduce(
        (acc, ext) => acc + ext.extra.price * ext.quantity,
        0,
      );
      return total + itemExtrasTotal * item.quantity;
    }, 0);
  }

  // Calcular monto de descuento
  static calculateDiscountAmount(
    subtotal: number,
    discountType: "amount" | "percentage" | "none",
    discountValue: number,
  ): number {
    // 🆕 Guard: asegurar que subtotal es número
    const safeSubtotal = Number(subtotal) || 0;
    const safeValue = Number(discountValue) || 0;

    if (discountType === "none" || safeValue <= 0) {
      return 0;
    }

    if (discountType === "amount") {
      return Math.min(safeValue, safeSubtotal);
    }

    if (discountType === "percentage") {
      const percentage = Math.min(safeValue, 100);
      return (safeSubtotal * percentage) / 100;
    }

    return 0;
  }

  static calculateOrderTotal(params: {
    selectedBurgers: SelectedBurger[];
    selectedCombos: any[];
    deliveryType: string;
    deliveryFee: number;
    meatExtra?: { price: number } | null;
    friesExtra?: { price: number } | null;
    discountType?: string;
    discountValue?: number;
  }) {
    // 🆕 Guards para arrays
    const safeBurgers = Array.isArray(params.selectedBurgers)
      ? params.selectedBurgers
      : [];
    const safeCombos = Array.isArray(params.selectedCombos)
      ? params.selectedCombos
      : [];

    const subtotal = this.calculateSubtotal(
      safeBurgers,
      safeCombos,
      params.meatExtra,
      params.friesExtra,
    );

    console.log("🔍 SUBTOTAL:", subtotal);

    // 🆕 Normalizar discountType a tipo correcto
    const normalizedDiscountType =
      params.discountType === "amount" || params.discountType === "percentage"
        ? params.discountType
        : "none";

    const discountAmount = this.calculateDiscountAmount(
      subtotal,
      normalizedDiscountType,
      params.discountValue || 0,
    );

    console.log("🔍 DISCOUNT AMOUNT:", discountAmount);

    const deliveryFee =
      params.deliveryType === "delivery" ? Number(params.deliveryFee) || 0 : 0;

    console.log("🔍 DELIVERY FEE:", deliveryFee);

    const total = subtotal - discountAmount + deliveryFee;

    console.log("🔍 TOTAL FINAL:", total);

    // 🆕 Guard final: asegurar que retornamos un número válido
    return Number.isFinite(total) ? total : 0;
  }

  // Método helper para obtener el subtotal
  static calculateSubtotal(
    selectedBurgers: SelectedBurger[],
    selectedCombos: SelectedCombo[],
    meatExtra?: { price: number } | null,
    friesExtra?: { price: number } | null,
  ): number {
    const burgersTotal = this.calculateBurgersTotal(
      selectedBurgers,
      friesExtra,
    );

    const combosTotal = this.calculateCombosTotal(
      selectedCombos,
      meatExtra,
      friesExtra,
    );

    const total = burgersTotal + combosTotal;

    // 🆕 Guard: asegurar número válido
    return Number.isFinite(total) ? total : 0;
  }
}
