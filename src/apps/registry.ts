import type { DomainSpec } from '@/skeleton/schema/domain';
import type { AppId } from '@/skeleton/schema/session';
import { postmortemCourtSpec } from '@/apps/postmortem-court/domain.spec';
import { defenseTribunalSpec } from '@/apps/defense-tribunal/domain.spec';

export const APP_REGISTRY: Record<AppId, DomainSpec<any>> = {
  'postmortem-court': postmortemCourtSpec,
  'defense-tribunal': defenseTribunalSpec,
};

export const ALL_APPS: DomainSpec<any>[] = [postmortemCourtSpec, defenseTribunalSpec];

export function getAppSpec(appId: AppId): DomainSpec<any> {
  return APP_REGISTRY[appId];
}
