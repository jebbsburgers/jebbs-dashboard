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

Costo de envío: ${formatCurrency(order.delivery_fee)}
`
    : `
🏪 *Retiro en local*
El cliente pasa a retirar
`;

  return `
*JEBBS BURGERS*

🧾 *PEDIDO #${order.order_number}*

🕒 *Fecha*
${formatDateTime(order.created_at)}

👤 *Cliente*
${order.customer_name}

📌 *Estado*
${status.label}
${deliveryBlock}

📦 *Detalle*
${order.order_items
  .map((item) => {
    const extras = item.order_item_extras?.length
      ? item.order_item_extras
          .map(
            (extra) =>
              `   + ${extra.quantity} x ${extra.extra_name} (${formatCurrency(extra.unit_price)})`,
          )
          .join("\n")
      : "";

    return `
• ${item.quantity} x ${item.burger_name} — ${formatCurrency(item.subtotal)}
${extras}
`.trim();
  })
  .join("\n\n")}

💰 *Total*
${formatCurrency(order.total_amount)}

------------------------
Gracias por tu compra 🙌
`.trim();
}
