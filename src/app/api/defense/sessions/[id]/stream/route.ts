import { defenseTribunalSpec } from '@/apps/defense-tribunal/domain.spec';
import { createDeliberationHandlers } from '@/skeleton/api/create-handlers';

export const dynamic = 'force-dynamic';

const handlers = createDeliberationHandlers(defenseTribunalSpec);

export const GET = handlers.streamSession;
