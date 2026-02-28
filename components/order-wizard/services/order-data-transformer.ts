import type { OrderItemInput } from "@/lib/hooks/orders/use-create-order";
import { SelectedBurger } from "@/lib/types/combo-types";
import { SelectedSide } from "../hooks/use-side-selection";

interface SelectedComboSlot {
  slotId: string;
  slotType: "burger" | "drink" | "side" | "nuggets";
  maxQuantity: number;
  defaultMeatCount?: number;
  burgers: SelectedBurger[];
  selectedExtra: { id: string; name: string; price: number } | null;
}

interface SelectedCombo {
  id: string;
  combo: { id: string; name: string; price: number };
  quantity: number;
  slots: SelectedComboSlot[];
}

export class OrderDataTransformer {
  static transformBurgersToOrderItems(
    burgers: SelectedBurger[],
    friesExtra?: { price: number } | null,
  ): OrderItemInput[] {
    return burgers.map((item) => {
      const unitPrice = item.burger.base_price + item.meatPriceAdjustment;

      const baseFries = item.burger.default_fries_quantity ?? 1;
      const friesDiff = item.friesQuantity - baseFries;

      let friesAdjustment = 0;
      if (friesExtra) {
        friesAdjustment = friesDiff * friesExtra.price * item.quantity;
      }

      const customizationData = {
        meatCount: item.meatCount,
        friesQuantity: item.friesQuantity,
        friesAdjustment,
        removedIngredients: item.removedIngredients,
        extras: item.selectedExtras.map((ext) => ({
          id: ext.extra.id,
          name: ext.extra.name,
          quantity: ext.quantity,
          price: ext.extra.price,
        })),
      };

      return {
        burger_id: item.burger.id,
        combo_id: null,
        burger_name: item.burger.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: unitPrice * item.quantity + friesAdjustment,
        customizations: JSON.stringify(customizationData),
        extras: item.selectedExtras.map((ext) => ({
          extra_id: ext.extra.id,
          extra_name: ext.extra.name,
          quantity: ext.quantity,
          unit_price: ext.extra.price,
          subtotal: ext.extra.price * ext.quantity,
        })),
      };
    });
  }

  static transformCombosToOrderItems(
    combos: SelectedCombo[],
    meatExtra?: { price: number } | null,
    friesExtra?: { price: number } | null,
  ): OrderItemInput[] {
    return combos.map((c) => {
      let comboSubtotal = c.combo.price * c.quantity;

      c.slots.forEach((slot) => {
        slot.burgers.forEach((burger) => {
          const burgerExtras = burger.selectedExtras.reduce(
            (acc, ext) => acc + ext.extra.price * ext.quantity,
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

          comboSubtotal +=
            (burgerExtras + meatAdjustment + friesAdjustment) * burger.quantity;
        });

        if (slot.selectedExtra && slot.selectedExtra.price > 0) {
          comboSubtotal += slot.selectedExtra.price * c.quantity;
        }
      });

      return {
        burger_id: null,
        combo_id: c.combo.id,
        burger_name: c.combo.name,
        quantity: c.quantity,
        unit_price: c.combo.price,
        subtotal: comboSubtotal,
        customizations: JSON.stringify(
          c.slots.map((s) => ({
            slotId: s.slotId,
            slotType: s.slotType,
            burgers: s.burgers.map((b) => ({
              burgerId: b.burger.id,
              name: b.burger.name,
              meatCount: b.meatCount,
              friesQuantity: b.friesQuantity,
              friesAdjustment: friesExtra
                ? (b.friesQuantity - (b.burger.default_fries_quantity ?? 1)) *
                  friesExtra.price *
                  b.quantity
                : 0,
              quantity: b.quantity,
              removedIngredients: b.removedIngredients,
              extras: b.selectedExtras.map((ext) => ({
                id: ext.extra.id,
                name: ext.extra.name,
                quantity: ext.quantity,
                price: ext.extra.price,
              })),
            })),
            selectedExtra: s.selectedExtra
              ? {
                  id: s.selectedExtra.id,
                  name: s.selectedExtra.name,
                  price: s.selectedExtra.price,
                }
              : null,
          })),
        ),
        extras: [],
      };
    });
  }

  // 🆕 Sides como order items independientes
static transformSidesToOrderItems(sides: SelectedSide[]): OrderItemInput[] {
  return sides.map((s) => ({
    burger_id: null,
    combo_id: null,
    extra_id: s.extra.id,
    burger_name: s.extra.name,
    quantity: s.quantity,
    unit_price: s.extra.price,

    // 🔥 SOLO el precio base
    subtotal: s.extra.price * s.quantity,

    customizations: null,

    // los extras van separados
    extras: s.selectedExtras.map((e) => ({
      extra_id: e.extra.id,
      extra_name: e.extra.name,
      quantity: e.quantity,
      unit_price: e.extra.price,
      subtotal: e.extra.price * e.quantity,
    })),
  }));
}

  static transformToOrderPayload(
    burgers: SelectedBurger[],
    combos: SelectedCombo[],
    meatExtra?: { price: number } | null,
    friesExtra?: { price: number } | null,
    sides?: SelectedSide[],
  ): OrderItemInput[] {
    const comboItems = this.transformCombosToOrderItems(combos, meatExtra, friesExtra);
    const burgerItems = this.transformBurgersToOrderItems(burgers, friesExtra);
    const sideItems = sides?.length ? this.transformSidesToOrderItems(sides) : [];

    return [...comboItems, ...burgerItems, ...sideItems];
  }
}