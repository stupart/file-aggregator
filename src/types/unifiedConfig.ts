//src/types/unifiedConfig.ts

import { ExclusionConfig } from './exclusions';
import { PromptConfig, UserConfig } from './config';
import { OutputFormat } from './output';

export interface AIREADMEConfig {
  exclusions: ExclusionConfig;
  prompt: PromptConfig;
  outputFormat: OutputFormat;
  ui: {
    theme: UserConfig['theme'];
    recentProjects: UserConfig['recentProjects'];
    maxRecentProjects: UserConfig['maxRecentProjects'];
  };
}