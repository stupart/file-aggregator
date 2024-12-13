// src/hooks/usePresetManager.ts
import { useState, useCallback } from 'react';
import { SharePreset, ExclusionConfig } from '../types';

export const usePresetManager = (onExclusionChange: (config: ExclusionConfig) => void) => {
    const [activePreset, setActivePreset] = useState<string | null>(null);
    const [presets, setPresets] = useState<SharePreset[]>([]);

    const handlePresetSelect = useCallback((presetId: string) => {
        setActivePreset(presetId);
        const selectedPreset = presets.find(p => p.id === presetId);
        if (selectedPreset) {
            onExclusionChange(selectedPreset.exclusions);
        }
    }, [presets, onExclusionChange]);

    const handleEditPreset = (preset: SharePreset) => {
        // TODO: Implement preset editing
        console.log('Editing preset:', preset);
    };

    const handleCreatePreset = () => {
        // TODO: Implement preset creation
        console.log('Creating new preset');
    };

    return {
        activePreset,
        setActivePreset,  // Add this
        presets,
        setPresets,      // Add this
        handlePresetSelect,
        handleEditPreset,
        handleCreatePreset
    };
};