export type ApiEndpointCategory =
  | "health"
  | "admin"
  | "public"
  | "authenticated"
  | "webhook"
  | "cron"
  | "dev";

export type ApiEndpointMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type ApiProbeSkipReason =
  | "side_effects"
  | "webhook"
  | "cron"
  | "dev_only"
  | "needs_params"
  | "needs_user_context";

export type ApiEndpointProbePolicy =
  | { probe: true; expectedStatuses: number[] }
  | { probe: false; reason: ApiProbeSkipReason };

export type ApiEndpointDefinition = {
  id: string;
  method: ApiEndpointMethod;
  pathPattern: string;
  category: ApiEndpointCategory;
  expectedAuth: "public" | "requires_auth" | "requires_admin";
  probePolicy: ApiEndpointProbePolicy;
};

export const API_ENDPOINT_REGISTRY: ApiEndpointDefinition[] = [
  {
    id: "health-get",
    method: "GET",
    pathPattern: "/api/health",
    category: "health",
    expectedAuth: "public",
    probePolicy: { probe: true, expectedStatuses: [200, 503] },
  },
  {
    id: "config-get",
    method: "GET",
    pathPattern: "/api/config",
    category: "admin",
    expectedAuth: "requires_admin",
    probePolicy: { probe: true, expectedStatuses: [200] },
  },
  {
    id: "price-get",
    method: "GET",
    pathPattern: "/api/price",
    category: "public",
    expectedAuth: "public",
    probePolicy: { probe: false, reason: "needs_params" },
  },
  {
    id: "signed-url-get",
    method: "GET",
    pathPattern: "/api/signed-url",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "needs_params" },
  },
  {
    id: "credits-get",
    method: "GET",
    pathPattern: "/api/credits",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: true, expectedStatuses: [200] },
  },
  {
    id: "orders-get",
    method: "GET",
    pathPattern: "/api/orders",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: true, expectedStatuses: [200] },
  },
  {
    id: "orders-by-session-get",
    method: "GET",
    pathPattern: "/api/orders/by-session",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "needs_params" },
  },
  {
    id: "order-detail-get",
    method: "GET",
    pathPattern: "/api/orders/[orderId]",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "needs_params" },
  },
  {
    id: "order-pdf-get",
    method: "GET",
    pathPattern: "/api/orders/[orderId]/pdf",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "needs_params" },
  },
  {
    id: "collections-get",
    method: "GET",
    pathPattern: "/api/collections",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: true, expectedStatuses: [200] },
  },
  {
    id: "collections-post",
    method: "POST",
    pathPattern: "/api/collections",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "collection-patch",
    method: "PATCH",
    pathPattern: "/api/collections/[collectionId]",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "collection-delete",
    method: "DELETE",
    pathPattern: "/api/collections/[collectionId]",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "conversions-get",
    method: "GET",
    pathPattern: "/api/conversions",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: true, expectedStatuses: [200] },
  },
  {
    id: "conversion-delete",
    method: "DELETE",
    pathPattern: "/api/conversions/[id]",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "conversion-patch",
    method: "PATCH",
    pathPattern: "/api/conversions/[id]",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "checkout-post",
    method: "POST",
    pathPattern: "/api/checkout",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "upload-post",
    method: "POST",
    pathPattern: "/api/upload",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "upload-cover-post",
    method: "POST",
    pathPattern: "/api/upload/cover",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "account-delete-post",
    method: "POST",
    pathPattern: "/api/account/delete",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "convert-post",
    method: "POST",
    pathPattern: "/api/pages/convert",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "books-post",
    method: "POST",
    pathPattern: "/api/books",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "book-get",
    method: "GET",
    pathPattern: "/api/books/[bookId]",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "needs_params" },
  },
  {
    id: "book-patch",
    method: "PATCH",
    pathPattern: "/api/books/[bookId]",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "book-delete",
    method: "DELETE",
    pathPattern: "/api/books/[bookId]",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "book-cover-patch",
    method: "PATCH",
    pathPattern: "/api/books/[bookId]/cover",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "book-pages-post",
    method: "POST",
    pathPattern: "/api/books/[bookId]/pages",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "book-pages-reorder-patch",
    method: "PATCH",
    pathPattern: "/api/books/[bookId]/pages/reorder",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "book-page-patch",
    method: "PATCH",
    pathPattern: "/api/books/[bookId]/pages/[pageId]",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "book-page-delete",
    method: "DELETE",
    pathPattern: "/api/books/[bookId]/pages/[pageId]",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "book-price-get",
    method: "GET",
    pathPattern: "/api/books/[bookId]/price",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "needs_params" },
  },
  {
    id: "book-price-post",
    method: "POST",
    pathPattern: "/api/books/[bookId]/price",
    category: "authenticated",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "admin-api-health-get",
    method: "GET",
    pathPattern: "/api/admin/api-health",
    category: "admin",
    expectedAuth: "requires_admin",
    probePolicy: { probe: false, reason: "needs_user_context" },
  },
  {
    id: "admin-users-get",
    method: "GET",
    pathPattern: "/api/admin/users",
    category: "admin",
    expectedAuth: "requires_admin",
    probePolicy: { probe: true, expectedStatuses: [200] },
  },
  {
    id: "admin-user-get",
    method: "GET",
    pathPattern: "/api/admin/users/[userId]",
    category: "admin",
    expectedAuth: "requires_admin",
    probePolicy: { probe: false, reason: "needs_params" },
  },
  {
    id: "admin-user-post",
    method: "POST",
    pathPattern: "/api/admin/users/[userId]",
    category: "admin",
    expectedAuth: "requires_admin",
    probePolicy: { probe: false, reason: "side_effects" },
  },
  {
    id: "admin-orders-get",
    method: "GET",
    pathPattern: "/api/admin/orders",
    category: "admin",
    expectedAuth: "requires_admin",
    probePolicy: { probe: true, expectedStatuses: [200] },
  },
  {
    id: "admin-order-pdf-get",
    method: "GET",
    pathPattern: "/api/admin/orders/[orderId]/pdf",
    category: "admin",
    expectedAuth: "requires_admin",
    probePolicy: { probe: false, reason: "needs_params" },
  },
  {
    id: "admin-conversions-get",
    method: "GET",
    pathPattern: "/api/admin/conversions",
    category: "admin",
    expectedAuth: "requires_admin",
    probePolicy: { probe: true, expectedStatuses: [200] },
  },
  {
    id: "admin-content-get",
    method: "GET",
    pathPattern: "/api/admin/content",
    category: "admin",
    expectedAuth: "requires_admin",
    probePolicy: { probe: true, expectedStatuses: [200] },
  },
  {
    id: "admin-logs-get",
    method: "GET",
    pathPattern: "/api/admin/logs",
    category: "admin",
    expectedAuth: "requires_admin",
    probePolicy: { probe: true, expectedStatuses: [200] },
  },
  {
    id: "admin-economics-get",
    method: "GET",
    pathPattern: "/api/admin/economics",
    category: "admin",
    expectedAuth: "requires_admin",
    probePolicy: { probe: true, expectedStatuses: [200] },
  },
  {
    id: "cleanup-originals-get",
    method: "GET",
    pathPattern: "/api/cron/cleanup-originals",
    category: "cron",
    expectedAuth: "public",
    probePolicy: { probe: false, reason: "cron" },
  },
  {
    id: "stripe-webhook-post",
    method: "POST",
    pathPattern: "/api/webhooks/stripe",
    category: "webhook",
    expectedAuth: "public",
    probePolicy: { probe: false, reason: "webhook" },
  },
  {
    id: "lulu-webhook-post",
    method: "POST",
    pathPattern: "/api/webhooks/lulu",
    category: "webhook",
    expectedAuth: "public",
    probePolicy: { probe: false, reason: "webhook" },
  },
  {
    id: "dev-lulu-check-get",
    method: "GET",
    pathPattern: "/api/dev/lulu-check",
    category: "dev",
    expectedAuth: "public",
    probePolicy: { probe: false, reason: "dev_only" },
  },
  {
    id: "dev-lulu-debug-get",
    method: "GET",
    pathPattern: "/api/dev/lulu-debug",
    category: "dev",
    expectedAuth: "public",
    probePolicy: { probe: false, reason: "dev_only" },
  },
  {
    id: "dev-add-free-credits-post",
    method: "POST",
    pathPattern: "/api/dev/add-free-credits",
    category: "dev",
    expectedAuth: "requires_auth",
    probePolicy: { probe: false, reason: "dev_only" },
  },
];

