import type { AppId } from '@/skeleton/schema/session';
import { postmortemCourtSpec } from '@/apps/postmortem-court/domain.spec';
import { defenseTribunalSpec } from '@/apps/defense-tribunal/domain.spec';

export type AppSpec = typeof postmortemCourtSpec | typeof defenseTribunalSpec;

export const APP_REGISTRY: Record<AppId, AppSpec> = {
  'postmortem-court': postmortemCourtSpec,
  'defense-tribunal': defenseTribunalSpec,
};

export const ALL_APPS: AppSpec[] = [postmortemCourtSpec, defenseTribunalSpec];

export function getAppSpec(appId: AppId): AppSpec {
  return APP_REGISTRY[appId];
}
