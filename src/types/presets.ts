//src/types/presets.ts

import { ExclusionConfig } from './exclusions';
import { OutputFormat } from './output';

export interface SharePreset {
    id: string;
    name: string;
    description: string;
    isDefault?: boolean;
    exclusions: ExclusionConfig;
    outputFormat: OutputFormat;
    includeContext: {
        stack: boolean;
        description: boolean;
        dependencies: boolean;
        scripts: boolean;
    };
}