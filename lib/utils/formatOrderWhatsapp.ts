import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { orderStatusConfig } from "@/lib/utils/order-status";
import type { Order } from "@/lib/types";

export function formatOrderForWhatsapp(order: Order) {
  const status = orderStatusConfig[order.status];
  const isDelivery = order.delivery_type === "delivery";

  const address = order.customer?.customer_addresses?.find(
    (a) => a.id === order.customer_address_id,
  );

  // 🆕 Bloque de entrega con horario
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

  // 🆕 Calcular subtotal (antes de descuentos y envío)
  const itemsTotal = order.order_items.reduce((sum, item) => {
    const itemSubtotal = item.subtotal;
    const extrasTotal =
      item.order_item_extras?.reduce(
        (extraSum, extra) => extraSum + extra.subtotal,
        0,
      ) ?? 0;
    return sum + itemSubtotal + extrasTotal;
  }, 0);

  // 🆕 Bloque de totales con descuento
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

  return `
*JEBBS BURGERS*

🧾 *PEDIDO #${order.order_number}*

🕒 *Fecha*
${formatDateTime(order.created_at)}

👤 *Cliente*
${order.customer_name}

${deliveryBlock}

📦 *Detalle del Pedido*
${order.order_items
  .map((item) => {
    // Calcular total del item (subtotal + extras)
    const extrasTotal =
      item.order_item_extras?.reduce((sum, extra) => sum + extra.subtotal, 0) ??
      0;
    const itemTotal = item.subtotal + extrasTotal;

    // Formatear extras si existen
    const extras = item.order_item_extras?.length
      ? "\n" +
        item.order_item_extras
          .map(
            (extra) =>
              `   + ${extra.quantity}x ${extra.extra_name} — ${formatCurrency(extra.subtotal)}`,
          )
          .join("\n")
      : "";

    return `• ${item.quantity}x ${item.burger_name} — ${formatCurrency(item.subtotal)}${extras}
${extrasTotal > 0 ? `   *Total item: ${formatCurrency(itemTotal)}*` : ""}`;
  })
  .join("\n\n")}
${totalsBlock}
------------------------
💳 *Método de pago*
${order.payment_method === "cash" ? "💵 Efectivo" : "🏦 Transferencia"}

${order.notes ? `📝 *Notas*\n${order.notes}\n\n------------------------\n` : ""}
Gracias por tu compra 🙌
`.trim();
}
