import type { DetectionRule } from './types';
import { suidRule, sgidRule } from './suidSgid';
import { capabilitiesRule } from './capabilities';
import { cronScheduleRule, writableCronLocationRule } from './cron';
import { wildcardInjectionRule } from './wildcardInjection';
import { writableFileRule } from './writable';
import { pathHijackRule } from './pathHijack';
import { sudoConfigRule } from './sudo';
import { sshConfigRule } from './ssh';
import { credentialKeywordRule } from './credentials';
import { sensitiveFileReadableRule, readableRootHomeRule } from './sensitiveFiles';
import { kernelInfoRule, exploitSuggesterRule } from './kernel';
import { dockerSocketRule, containerContextRule } from './containers';
import { nfsExportsRule } from './nfs';
import { riskyMountRule } from './mounts';
import { additionalRootUserRule, privilegedGroupMembershipRule } from './users';
import { writableServiceDefinitionRule } from './services';
import { processFromWritableDirRule } from './processes';
import { interestingEnvironmentVariableRule } from './environment';
import { exposedServiceRule } from './network';
import { pamMisconfigRule } from './authentication';
import { writableConfigFileRule, colorFlaggedFallbackRule } from './misconfig';

export type { AnalysisContext, DetectionRule, FindingDraft } from './types';

/**
 * Every registered detection rule. New signals are added by writing a rule
 * module and appending it here — nothing else in the analysis pipeline
 * needs to change.
 */
export const allDetectionRules: DetectionRule[] = [
  suidRule,
  sgidRule,
  capabilitiesRule,
  cronScheduleRule,
  writableCronLocationRule,
  wildcardInjectionRule,
  writableFileRule,
  pathHijackRule,
  sudoConfigRule,
  sshConfigRule,
  credentialKeywordRule,
  sensitiveFileReadableRule,
  readableRootHomeRule,
  kernelInfoRule,
  exploitSuggesterRule,
  dockerSocketRule,
  containerContextRule,
  nfsExportsRule,
  riskyMountRule,
  additionalRootUserRule,
  privilegedGroupMembershipRule,
  writableServiceDefinitionRule,
  processFromWritableDirRule,
  interestingEnvironmentVariableRule,
  exposedServiceRule,
  pamMisconfigRule,
  writableConfigFileRule,
  colorFlaggedFallbackRule,
];
