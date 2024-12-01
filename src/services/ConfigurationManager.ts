// src/services/ConfigurationManager.ts

import { UserConfig, PromptConfig } from '../types';

const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  includeFileTree: true,
  includeIdentity: false,
  includeProject: true,
  includeTask: false,
  addFileHeaders: true,
  generatePseudocode: false
};

export class ConfigurationManager {
  constructor(private electronAPI: Window['electronAPI']) {}

  public async loadPromptConfig(): Promise<PromptConfig> {
    try {
      const userConfig = await this.electronAPI.loadUserConfig();
      return {
        ...DEFAULT_PROMPT_CONFIG,
        ...userConfig.promptConfig
      };
    } catch (error) {
      console.error('Failed to load prompt config:', error);
      return DEFAULT_PROMPT_CONFIG;
    }
  }

  public async savePromptConfig(config: PromptConfig): Promise<void> {
    const userConfig = await this.electronAPI.loadUserConfig();
    await this.electronAPI.saveUserConfig({
      ...userConfig,
      promptConfig: config
    });
  }
}