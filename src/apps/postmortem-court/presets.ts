import type { PresetCase } from '@/skeleton/schema/domain';

export const postmortemCourtPresets: PresetCase[] = [
  {
    id: 'pgbouncer-504-cascade',
    label: 'PgBouncer 504 Cascade',
    summary: 'Checkout deploy diff + connection pool saturation + mobile retry storm',
    title: 'Checkout API 504 Cascade & PgBouncer Pool Exhaustion',
    rawInput: `--- a/src/services/checkout.ts
+++ b/src/services/checkout.ts
@@ -78,9 +78,12 @@ export async function capturePayment(orderId: string) {
   const client = await pgPool.connect();
   await client.query('BEGIN');
   const order = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
+  if (order.rows[0]?.status === 'CANCELLED') {
+    return { skipped: true, reason: 'already_cancelled' };
+  }
   await stripeClient.capture(order.rows[0].intent_id);
   await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['CAPTURED', orderId]);
   await client.query('COMMIT');
   client.release();
 }

2026-11-21T21:13:40Z deploy-bot INFO Released checkout-api v4.18.2 (canary 100%)
2026-11-21T21:14:02Z pgbouncer WARN pool=orders_rw pool_size=200 active=200 waiting=842 maxwait=14.82s
2026-11-21T21:14:19Z postgres WARN 184 sessions idle in transaction (> 30s) holding RowExclusiveLock on orders
2026-11-21T21:14:43Z nginx-ingress ERROR upstream timed out (110: Connection timed out) -> 504 Gateway Timeout on POST /v2/checkout/capture
2026-11-21T21:15:01Z mobile-gateway INFO ios-app v4.2 auto-retry triggered without jitter: checkout QPS jumped 3.4x (420 -> 1,430 rps)
2026-11-21T21:16:12Z alertmanager CRITICAL P0 Checkout error rate 68.4%; payment webhooks backlogged 11,400 events`,
  },
  {
    id: 'jwt-tenant-bleed',
    label: 'Multi-Tenant Cache Bleed',
    summary: 'CDN edge cache key omission exposing tenant billing reports',
    title: 'Cross-Tenant Billing Export Leak on Edge Cache Layer',
    rawInput: `2026-11-18T08:02:11Z release-ci INFO Merged PR #1942 "Cache /api/v1/billing/summary at edge for 60s"
+ response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
+ response.headers.set('Vary', 'Accept-Encoding');

2026-11-18T08:04:05Z edge-proxy INFO HIT /api/v1/billing/summary?month=2026-11 age=14s tenant_jwt=org_acme_991 (cached_by=org_globex_204)
2026-11-18T08:06:19Z support-ticket CRITICAL Customer org_acme_991 reports seeing invoices belonging to Globex Corp in dashboard
2026-11-18T08:07:02Z auth-middleware WARN JWT verification passed; orgId extracted solely from Authorization: Bearer header, not URL path
2026-11-18T08:08:31Z secops ERROR Cloudflare/CDN cache key uses URL + query string only; Authorization header excluded from Vary and Cache-Key
2026-11-18T08:09:44Z audit-log INFO 47 cross-tenant GET hits served from warm edge PoPs (iad, fra, sin) before emergency purge`,
  },
  {
    id: 'redis-hotkey-thundering-herd',
    label: 'Redis Hot-Key Herd',
    summary: 'Synchronized TTL expiry triggering origin DB collapse and lock timeout',
    title: 'Midnight Feature-Flag TTL Stampede & Origin CPU Collapse',
    rawInput: `2026-11-15T00:00:00Z config-sync INFO Nightly batch job refreshed 1,200 global feature flags with identical EXPIRE=86400
2026-11-16T00:00:01Z redis-cluster WARN key="flags:global:v3" evicted/expired simultaneously across 12 shards
2026-11-16T00:00:02Z api-fleet ERROR 6,400 concurrent workers missed cache and called fetchFlagsFromPrimaryDB()
2026-11-16T00:00:04Z lock-service WARN Distributed lock "lock:rebuild:flags" TTL=2s expired while singleflight rebuild query took 6.8s
2026-11-16T00:00:07Z rds-primary CRITICAL CPU 99.8%, ReadIOPS throttled, active queries=2,910 (all SELECT * FROM feature_flags)
2026-11-16T00:00:18Z k8s-hpa WARN Liveness probe /healthz queries primary DB -> cascading pod restarts across 48 replicas`,
  },
];
