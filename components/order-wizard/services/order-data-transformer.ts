import type { OrderItemInput } from "@/lib/hooks/orders/use-create-order";
import { SelectedBurger } from "@/lib/types/combo-types";

interface SelectedComboSlot {
  slotId: string;
  slotType: "burger" | "drink" | "side" | "nuggets"; // 🆕 Agregar "nuggets"
  maxQuantity: number;
  defaultMeatCount?: number;
  burgers: SelectedBurger[];
  selectedExtra: { id: string; name: string; price: number } | null; // 🆕
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
  ): OrderItemInput[] {
    return burgers.map((item) => {
      const unitPrice = item.burger.base_price + item.meatPriceAdjustment;

      // ✅ Siempre guardar customizations como JSON
      const customizationData = {
        meatCount: item.meatCount,
        friesQuantity: item.friesQuantity,
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
        subtotal: unitPrice * item.quantity,
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

          // Medallones
          let meatAdjustment = 0;
          if (meatExtra) {
            const referenceMeatCount =
              slot.defaultMeatCount ?? burger.burger.default_meat_quantity ?? 2;
            const meatDiff = burger.meatCount - referenceMeatCount;
            meatAdjustment = meatDiff * meatExtra.price;
          }

          // Papas
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

        // 🆕 Sumar precio de selectedExtra si existe
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
            slotType: s.slotType, // 🆕 Incluir slotType
            burgers: s.burgers.map((b) => ({
              burgerId: b.burger.id,
              name: b.burger.name,
              meatCount: b.meatCount,
              friesQuantity: b.friesQuantity,
              quantity: b.quantity,
              removedIngredients: b.removedIngredients,
              extras: b.selectedExtras.map((ext) => ({
                id: ext.extra.id,
                name: ext.extra.name,
                quantity: ext.quantity,
                price: ext.extra.price,
              })),
            })),
            // 🆕 Incluir selectedExtra
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

  static transformToOrderPayload(
    burgers: SelectedBurger[],
    combos: SelectedCombo[],
    meatExtra?: { price: number } | null,
    friesExtra?: { price: number } | null,
  ): OrderItemInput[] {
    const comboItems = this.transformCombosToOrderItems(
      combos,
      meatExtra,
      friesExtra,
    );
    const burgerItems = this.transformBurgersToOrderItems(burgers);

    return [...comboItems, ...burgerItems];
  }
}
