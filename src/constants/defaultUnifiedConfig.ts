//src/constants/defaultUnifiedConfig.ts
import { AIREADMEConfig } from '../types/unifiedConfig';
import { DEFAULT_EXCLUSIONS, DEFAULT_USER_CONFIG } from './defaults';
import { OutputFormat } from '../types/output';

export const DEFAULT_PROMPT_CONFIG = {
  includeFileTree: true,
  includeIdentity: false,
  includeProject: true,
  includeTask: false,
  task: '',
  identity: '',
  addFileHeaders: true,
  generatePseudocode: false
};

export const DEFAULT_OUTPUT_FORMAT: OutputFormat = {
  destination: 'AIREADME.txt', // Explicitly typed literal
  format: {
    includeProjectContext: true,
    includeFileTree: true,
    fileComments: true,
    separators: true,
    maxFileSize: undefined
  },
  header: {
    title: undefined,
    description: undefined,
    customSections: {}
  }
};

export const DEFAULT_UNIFIED_CONFIG: AIREADMEConfig = {
  exclusions: DEFAULT_EXCLUSIONS,
  prompt: DEFAULT_PROMPT_CONFIG,
  outputFormat: DEFAULT_OUTPUT_FORMAT,
  ui: {
    theme: DEFAULT_USER_CONFIG.theme,
    recentProjects: DEFAULT_USER_CONFIG.recentProjects || [],
    maxRecentProjects: DEFAULT_USER_CONFIG.maxRecentProjects || 10
  }
};