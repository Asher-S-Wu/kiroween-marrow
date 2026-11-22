import { postmortemCourtSpec } from '@/apps/postmortem-court/domain.spec';
import { createDeliberationHandlers } from '@/skeleton/api/create-handlers';

export const dynamic = 'force-dynamic';

const handlers = createDeliberationHandlers(postmortemCourtSpec);

export const GET = handlers.streamSession;
