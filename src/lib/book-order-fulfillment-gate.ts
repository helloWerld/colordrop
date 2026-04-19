export type OrderFulfillmentGateRow = {
  lulu_print_job_id: number | null;
  status: string;
};

/**
 * Whether we should (re-)run Lulu fulfillment for this order row.
 * Used for Stripe webhook idempotency and confirmation polling.
 */
export function shouldEnqueueFulfillment(row: OrderFulfillmentGateRow): boolean {
  if (row.lulu_print_job_id != null) return false;
  if (row.status === "error" || row.status === "refunded") return false;
  return true;
}

export function isOrderPrintSubmitted(row: OrderFulfillmentGateRow): boolean {
  return row.lulu_print_job_id != null;
}

export function isOrderFulfillmentFailed(row: OrderFulfillmentGateRow): boolean {
  return row.status === "error" || row.status === "refunded";
}
