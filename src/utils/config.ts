// src/utils/config.ts
import { ExclusionConfig, UserConfig, SharePreset } from '../types';

export async function loadAndMergeConfigs() {
    const [exclusions, userConfig] = await Promise.all([
        window.electronAPI.loadConfig(),
        window.electronAPI.loadUserConfig()
    ]);
    return { exclusions, userConfig };
}

export async function saveUserPreferences(config: Partial<UserConfig>) {
    const current = await window.electronAPI.loadUserConfig();
    await window.electronAPI.saveUserConfig({
        ...current,
        ...config
    });
}

export async function addRecentProject(path: string) {
    const current = await window.electronAPI.loadUserConfig();
    await window.electronAPI.saveUserConfig({
        ...current,
        recentProjects: [
            path,
            ...(current.recentProjects || []).filter(p => p !== path)
        ].slice(0, current.maxRecentProjects || 10)
    });
}