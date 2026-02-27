import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { orderStatusConfig } from "@/lib/utils/order-status";
import type { Order } from "@/lib/types";

export function formatOrderForWhatsapp(order: Order) {
  const status = orderStatusConfig[order.status];
  const isDelivery = order.delivery_type === "delivery";

  const address = order.customer?.customer_addresses?.find(
    (a) => a.id === order.customer_address_id,
  );

  const deliveryBlock = isDelivery
    ? `
🚚 *Envío a domicilio*
📍 ${address?.address ?? "Dirección no especificada"}
${address?.notes ? `📝 ${address.notes}` : ""}
${order.delivery_time ? `🕐 Entregar a las: *${order.delivery_time}*` : ""}
`
    : `
🏪 *Retiro en local*
${order.delivery_time ? `🕐 Retirar a las: *${order.delivery_time}*\n` : ""}El cliente pasa a retirar
`;

  const itemsTotal = order.order_items.reduce((sum, item) => {
    const extrasTotal =
      item.order_item_extras?.reduce(
        (extraSum, extra) => extraSum + extra.subtotal,
        0,
      ) ?? 0;
    return sum + item.subtotal + extrasTotal;
  }, 0);

  const totalsBlock = `
💰 *Totales*
Subtotal: ${formatCurrency(itemsTotal)}
${order.delivery_fee > 0 ? `Envío: ${formatCurrency(order.delivery_fee)}` : ""}
${
  order.discount_amount > 0
    ? `Descuento${order.discount_type === "percentage" ? ` (${order.discount_value}%)` : ""}: -${formatCurrency(order.discount_amount)}`
    : ""
}
${order.discount_amount > 0 || order.delivery_fee > 0 ? "------------------------" : ""}

*TOTAL: ${formatCurrency(order.total_amount)}*
`;

  const itemsBlock = order.order_items
    .map((item) => {
      const extrasTotal =
        item.order_item_extras?.reduce((sum, extra) => sum + extra.subtotal, 0) ?? 0;
      const itemTotal = item.subtotal + extrasTotal;

      // ===== SIDE (extra_id presente) =====
      if (item.extra_id) {
        const extrasLines = item.order_item_extras?.length
          ? "\n" +
            item.order_item_extras
              .map(
                (extra) =>
                  `   + ${extra.quantity}x ${extra.extra_name}${extra.subtotal > 0 ? ` — ${formatCurrency(extra.subtotal)}` : ""}`,
              )
              .join("\n")
          : "";

        return `🍟 ${item.quantity}x ${item.burger_name} — ${formatCurrency(item.subtotal)}${extrasLines}${extrasTotal > 0 ? `\n   *Total item: ${formatCurrency(itemTotal)}*` : ""}`;
      }

      // ===== BURGER o COMBO =====
      let customData: any = null;
      let isCombo = false;
      if (item.customizations) {
        try {
          customData = JSON.parse(item.customizations);
          isCombo = Array.isArray(customData);
        } catch {}
      }

      // Líneas de detalle de burger individual
      const burgerDetailLines: string[] = [];

      if (!isCombo && customData) {
        // Papas
        if (customData.friesQuantity !== undefined) {
          if (customData.friesQuantity === 0) {
            const discount = Math.abs(customData.friesAdjustment ?? 0);
            burgerDetailLines.push(
              discount > 0
                ? `   🍟 Sin papas (-${formatCurrency(discount)})`
                : `   🍟 Sin papas`,
            );
          } else if ((customData.friesAdjustment ?? 0) > 0) {
            burgerDetailLines.push(
              `   🍟 ${customData.friesQuantity} papas (+${formatCurrency(customData.friesAdjustment)})`,
            );
          } else {
            burgerDetailLines.push(`   🍟 ${customData.friesQuantity} papas`);
          }
        }

        // Ingredientes removidos
        if (customData.removedIngredients?.length > 0) {
          burgerDetailLines.push(`   ❌ Sin: ${customData.removedIngredients.join(", ")}`);
        }

        // Extras
        if (customData.extras?.length > 0) {
          customData.extras.forEach((extra: any) => {
            burgerDetailLines.push(
              `   + ${extra.quantity}x ${extra.name} — ${formatCurrency(extra.price * extra.quantity)}`,
            );
          });
        }
      }

      // Para combos, agregar detalle de burgers dentro de cada slot
      const comboDetailLines: string[] = [];
      if (isCombo && Array.isArray(customData)) {
        customData.forEach((slot: any) => {
          if (slot.burgers?.length > 0) {
            slot.burgers.forEach((burger: any) => {
              comboDetailLines.push(`   🍔 ${burger.quantity}x ${burger.name} x${burger.meatCount}`);

              if (burger.friesQuantity !== undefined) {
                if (burger.friesQuantity === 0) {
                  const discount = Math.abs(burger.friesAdjustment ?? 0);
                  comboDetailLines.push(
                    discount > 0
                      ? `      🍟 Sin papas (-${formatCurrency(discount)})`
                      : `      🍟 Sin papas`,
                  );
                } else if ((burger.friesAdjustment ?? 0) > 0) {
                  comboDetailLines.push(
                    `      🍟 ${burger.friesQuantity} papas (+${formatCurrency(burger.friesAdjustment)})`,
                  );
                } else {
                  comboDetailLines.push(`      🍟 ${burger.friesQuantity} papas`);
                }
              }

              if (burger.removedIngredients?.length > 0) {
                comboDetailLines.push(`      ❌ Sin: ${burger.removedIngredients.join(", ")}`);
              }

              if (burger.extras?.length > 0) {
                burger.extras.forEach((extra: any) => {
                  comboDetailLines.push(
                    `      + ${extra.quantity}x ${extra.name} — ${formatCurrency(extra.price * extra.quantity)}`,
                  );
                });
              }
            });
          }

          if (slot.selectedExtra) {
            const label = slot.slotType === "drink" ? "🥤 Bebida" : "➕";
            comboDetailLines.push(`   ${label}: ${slot.selectedExtra.name}`);
          }
        });
      }

      const detailLines = isCombo ? comboDetailLines : burgerDetailLines;
      const detailBlock = detailLines.length > 0 ? "\n" + detailLines.join("\n") : "";

      // order_item_extras para extras guardados en DB (burgers con extras de DB)
      const dbExtrasLines =
        !isCombo && item.order_item_extras?.length
          ? "\n" +
            item.order_item_extras
              .map(
                (extra) =>
                  `   + ${extra.quantity}x ${extra.extra_name} — ${formatCurrency(extra.subtotal)}`,
              )
              .join("\n")
          : "";

      const extrasSuffix = isCombo && extrasTotal > 0
        ? `\n   *Total item: ${formatCurrency(itemTotal)}*`
        : extrasTotal > 0
          ? `\n   *Total item: ${formatCurrency(itemTotal)}*`
          : "";

      return `• ${item.quantity}x ${item.burger_name} — ${formatCurrency(item.subtotal)}${detailBlock}${dbExtrasLines}${extrasSuffix}`;
    })
    .join("\n\n");

  return `
*JEBBS BURGERS*

🧾 *PEDIDO #${order.order_number}*

🕒 *Fecha*
${formatDateTime(order.created_at)}

👤 *Cliente*
${order.customer_name}

${deliveryBlock}

📦 *Detalle del Pedido*
${itemsBlock}
${totalsBlock}
------------------------
💳 *Método de pago*
${order.payment_method === "cash" ? "💵 Efectivo" : "🏦 Transferencia"}

${order.notes ? `📝 *Notas*\n${order.notes}\n\n------------------------\n` : ""}
Gracias por tu compra 🙌
`.trim();
}