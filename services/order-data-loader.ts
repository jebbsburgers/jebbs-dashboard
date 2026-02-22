import { nanoid } from "nanoid";
import type { Extra } from "@/lib/types";
import type { OrderWithItems } from "@/lib/types";
import { SelectedBurger, SelectedCombo } from "@/lib/types/combo-types";

/**
 * Carga un pedido completo en el estado del wizard
 */
export function loadOrderIntoWizard(
  order: OrderWithItems,
  allExtras: Extra[],
  allBurgers: any[],
  allCombos: any[],
  meatExtra?: { price: number } | null, // 👈 agregar
) {
  return {
    customerData: loadCustomerData(order),
    burgers: loadBurgers(order, allBurgers, allExtras, meatExtra), // 👈 pasar
    combos: loadCombos(order, allCombos, allBurgers, allExtras),
    settings: loadSettings(order),
  };
}

/**
 * Extrae datos del cliente
 */
function loadCustomerData(order: OrderWithItems) {
  return {
    customerName: order.customer_name,
    customerId: order.customer_id,
    addressId: order.customer_address_id,
    address: order.customer_address || null,
  };
}

/**
 * Extrae settings del pedido
 */
function loadSettings(order: OrderWithItems) {
  return {
    deliveryType: order.delivery_type as "delivery" | "pickup",
    deliveryFee: order.delivery_fee || 0,
    deliveryTime: order.delivery_time || "", // 🆕 CRÍTICO para edición
    paymentMethod: order.payment_method as "cash" | "transfer",
    discountType:
      (order.discount_type as "amount" | "percentage" | "none") || "none",
    discountValue: order.discount_value || 0,
    notes: order.notes || "",
  };
}
/**
 * Carga burgers individuales (items sin combo_id)
 */
function loadBurgers(
  order: OrderWithItems,
  allBurgers: any[],
  allExtras: Extra[],
  meatExtra?: { price: number } | null, // 👈 agregar
): SelectedBurger[] {
  const burgerItems = order.items.filter((item) => !item.combo_id);

  return burgerItems
    .map((item) => {
      // Encontrar burger original
      const burger = allBurgers.find((b) => b.id === item.burger_id);

      if (!burger) {
        console.warn(`Burger ${item.burger_id} not found`);
        return null;
      }

      // Parsear customizations
      let customData: any = null;
      if (item.customizations) {
        try {
          customData = JSON.parse(item.customizations);
        } catch (e) {
          console.warn("Failed to parse burger customizations:", e);
        }
      }

      // Reconstruir extras
      const selectedExtras = (item.extras || []).map((extraItem) => {
        const extra = allExtras.find((e) => e.id === extraItem.extra_id);
        return {
          extra: extra || {
            id: extraItem.extra_id,
            name: extraItem.extra_name,
            price: extraItem.unit_price,
            category: "extra" as const,
            is_available: true,
            created_at: new Date().toISOString(),
          },
          quantity: extraItem.quantity,
        };
      });

      const meatCount =
        customData?.meatCount || burger.default_meat_quantity || 2;
      const meatDiff = meatCount - (burger.default_meat_quantity || 2);
      const meatPriceAdjustment = meatExtra ? meatDiff * meatExtra.price : 0; // 👈

      return {
        id: nanoid(),
        burger,
        quantity: item.quantity,
        meatCount: customData?.meatCount || burger.default_meat_quantity || 2,
        friesQuantity:
          customData?.friesQuantity ?? burger.default_fries_quantity ?? 1,
        removedIngredients: customData?.removedIngredients || [],
        selectedExtras,
        meatPriceAdjustment, // 👈 usar calculado
      };
    })
    .filter(Boolean) as SelectedBurger[];
}

/**
 * Carga combos (items con combo_id)
 */
function loadCombos(
  order: OrderWithItems,
  allCombos: any[],
  allBurgers: any[],
  allExtras: Extra[],
) {
  const comboItems = order.items.filter((item) => item.combo_id);

  return comboItems
    .map((item) => {
      // Buscar combo original
      const combo = allCombos.find((c) => c.id === item.combo_id);

      console.log("🔍 LOADING COMBO:");
      console.log("  - Item from DB:", item);
      console.log("  - Combo found:", combo);
      console.log("  - Using price:", item.unit_price);

      // Parsear customizations (array de slots)
      let slotsData: any[] = [];
      if (item.customizations) {
        try {
          slotsData = JSON.parse(item.customizations);
        } catch (e) {
          console.warn("Failed to parse combo customizations:", e);
        }
      }

      // Reconstruir slots
      const slots = slotsData
        .map((slotData) => {
          // Encontrar slot original en el combo (si existe)
          const originalSlot = combo?.slots?.find(
            (s: any) => s.id === slotData.slotId,
          );

          if (!originalSlot && !slotData.slotId) {
            console.warn("Slot without ID");
            return null;
          }

          // Reconstruir burgers del slot
          const burgers = (slotData.burgers || [])
            .map((burgerData: any) => {
              const burger = allBurgers.find(
                (b) => b.id === burgerData.burgerId,
              );

              if (!burger) {
                console.warn(`Burger ${burgerData.burgerId} not found in slot`);
                return null;
              }

              // Reconstruir extras de la burger
              const selectedExtras = (burgerData.extras || []).map(
                (extraData: any) => {
                  const extra = allExtras.find((e) => e.id === extraData.id);
                  return {
                    extra: extra || {
                      id: extraData.id,
                      name: extraData.name,
                      price: extraData.price,
                      category: "extra" as const,
                      is_available: true,
                      created_at: new Date().toISOString(),
                    },
                    quantity: extraData.quantity,
                  };
                },
              );

              return {
                id: nanoid(),
                burger,
                quantity: burgerData.quantity,
                meatCount: burgerData.meatCount,
                friesQuantity: burgerData.friesQuantity,
                removedIngredients: burgerData.removedIngredients || [],
                selectedExtras,
                meatPriceAdjustment: 0,
              };
            })
            .filter(Boolean);

          // Reconstruir selectedExtra (bebida o nuggets)
          let selectedExtra = null;
          if (slotData.selectedExtra) {
            const extra = allExtras.find(
              (e) => e.id === slotData.selectedExtra.id,
            );
            selectedExtra = extra || {
              id: slotData.selectedExtra.id,
              name: slotData.selectedExtra.name,
              price: slotData.selectedExtra.price || 0,
              category: "drink" as const,
              is_available: true,
              created_at: new Date().toISOString(),
            };
          }

          return {
            slotId: slotData.slotId,
            slotType: slotData.slotType,
            maxQuantity: Number(originalSlot?.quantity) ?? 1,
            minQuantity:
              Number(originalSlot?.rules?.min_quantity) ??
              Number(originalSlot?.quantity) ??
              1,
            defaultMeatCount: Number(originalSlot?.default_meat_quantity) ?? 2,
            rules: originalSlot?.rules || {
              min_quantity: 1,
              max_quantity: 1,
            },
            burgers,
            selectedExtra,
          };
        })
        .filter(Boolean);

      // 🆕 Crear ComboSnapshot con datos históricos
      return {
        id: nanoid(),
        combo: {
          id: item.combo_id || nanoid(),
          name: item.burger_name, // Nombre histórico
          price: Number(item.unit_price) || 0, // Precio histórico
          description: combo?.description || null, // 🆕
          is_available: combo?.is_available ?? true, // 🆕
          created_at: combo?.created_at || new Date().toISOString(), // 🆕
          slots: combo?.slots || [], // 🆕 Slots originales (pueden estar vacíos)
        },
        quantity: item.quantity,
        slots,
      };
    })
    .filter(Boolean) as SelectedCombo[];
}
