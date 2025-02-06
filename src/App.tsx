import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Tooltip,
  IconButton,
  Snackbar,
  Paper,
  Chip,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';

import { FileNode, PromptConfig, OutputFormat } from './types';
import { AIREADMEConfig } from './types/unifiedConfig';
import { DEFAULT_UNIFIED_CONFIG } from './constants/defaultUnifiedConfig';
import { FileTreeView } from './components/FileTree/FilesTreeView';
import { PromptConfigDialog } from './components/dialogs/PromptConfigDialog';

import { useServices } from './hooks/useServices';
import { useProjectManager } from './hooks/useProjectManager';
import { usePromptGeneration } from './hooks/usePromptGeneration';
import { useUIState } from './hooks/useUIState';
import { usePresetManager } from './hooks/usePresetManager';

const DEFAULT_OUTPUT_FORMAT: OutputFormat = {
  destination: 'AIREADME.txt',
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

const App: React.FC = () => {
  // Unified configuration state – our single source of truth.
  const [config, setConfig] = useState<AIREADMEConfig>(DEFAULT_UNIFIED_CONFIG);

  // Project management hooks.
  const { structure, projectRoot, projectContext, loadProject } = useProjectManager();

  // Service hooks.
  const { fileOps, promptBuilder } = useServices(projectRoot);

  // UI state hooks.
  const { snackbarOpen, setSnackbarOpen, snackbarMessage, showSnackbar } = useUIState();
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);

  // Preset management state.
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [presets, setPresets] = useState<any[]>([]);

  // File selection and prompt generation hooks.
  const { selectedFiles, setSelectedFiles, generatePromptContent } =
    usePromptGeneration(fileOps, promptBuilder, projectContext, structure, projectRoot, config.prompt);

  // On initial load, fetch unified config and presets from Electron.
  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        const unifiedCfg: AIREADMEConfig = await window.electronAPI.loadUnifiedConfig();
        setConfig(unifiedCfg);
        const loadedPresets = await window.electronAPI.loadPresets();
        setPresets(loadedPresets);
      } catch (error) {
        console.error('Error loading unified config:', error);
      }
    };
    loadConfigurations();
  }, []);

  const handleFolderSelect = async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) {
      try {
        await loadProject(folderPath);
        showSnackbar('Project loaded successfully');
      } catch (error) {
        console.error('Failed to load project:', error);
        showSnackbar('Failed to load project completely');
      }
    }
  };

  const handleExport = async () => {
    if (!structure) return;
    try {
      const selectedNodes = getAllSelectedNodes(structure);
      const content = await generatePromptContent(selectedNodes);
      await fileOps.savePrompt(content, projectRoot);
      showSnackbar('Prompt saved successfully as aireadme.txt');
    } catch (error) {
      console.error('Export failed:', error);
      showSnackbar('Failed to export files');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!structure) return;
    try {
      const selectedNodes = getAllSelectedNodes(structure);
      const content = await generatePromptContent(selectedNodes);
      await fileOps.copyToClipboard(content);
      showSnackbar('Content copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
      showSnackbar('Failed to copy to clipboard');
    }
  };

  // Recursively collect selected file nodes.
  const getAllSelectedNodes = (node: FileNode): FileNode[] => {
    let selected: FileNode[] = [];
    if (selectedFiles.has(node.path)) selected.push(node);
    if (node.children) {
      node.children.forEach(child => {
        selected = [...selected, ...getAllSelectedNodes(child)];
      });
    }
    return selected;
  };

  // Handle preset save – this is triggered from within the prompt configuration dialog.
  const handlePresetSave = (presetData: { name: string; unifiedConfig: AIREADMEConfig }) => {
    if (window.electronAPI.savePreset) {
      window.electronAPI
        .savePreset({
          id: `preset-${Date.now()}`,
          name: presetData.name,
          description: '', // Optionally add a description
          exclusions: config.exclusions,
          outputFormat: config.outputFormat,
          includeContext: {
            stack: true,
            description: true,
            dependencies: true,
            scripts: true,
          }
        })
        .then(() => {
          showSnackbar('Preset saved successfully');
          return window.electronAPI.loadPresets();
        })
        .then((updatedPresets: any[]) => {
          setPresets(updatedPresets);
        })
        .catch((e: any) => {
          console.error('Preset save error:', e);
          showSnackbar('Failed to save preset');
        });
    } else {
      console.error('window.electronAPI.savePreset is undefined');
      showSnackbar('Preset saving not available in this environment');
    }
  };

  // Handle preset selection from dropdown.
  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      // Assume the preset includes a complete unified config snapshot.
      setConfig(preset.unifiedConfig || {
        ...config,
        exclusions: preset.exclusions,
        outputFormat: preset.outputFormat,
      });
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Top bar with folder selection and settings/preset selection */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={handleFolderSelect} startIcon={<FolderOpenIcon />}>
            Select Folder
          </Button>
          {projectContext && (
            <Typography variant="body1" sx={{ alignSelf: 'center', color: 'text.secondary' }}>
              {projectContext.name}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={activePreset || ''}
              onChange={(e) => handlePresetSelect(e.target.value)}
              displayEmpty
              sx={{ bgcolor: 'background.paper' }}
            >
              <MenuItem value="">
                <em>No Preset Selected</em>
              </MenuItem>
              {presets.map((preset) => (
                <MenuItem key={preset.id} value={preset.id}>
                  {preset.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Prompt & Preset Settings">
            <IconButton onClick={() => setPromptDialogOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Project Info */}
      {projectContext && (
        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1">Project Info</Typography>
            <Chip size="small" label={projectContext.stack.type} color="primary" variant="outlined" />
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {projectContext.stack.framework.map((fw) => (
              <Chip key={fw} size="small" label={fw} variant="outlined" />
            ))}
          </Box>
        </Paper>
      )}

      {/* File Tree and Action Buttons */}
      {structure && (
        <>
          <FileTreeView
            structure={structure}
            exclusionConfig={config.exclusions}
            onSelectionChange={setSelectedFiles}
            onExclusionChange={(newExclusions) =>
              setConfig(prev => ({ ...prev, exclusions: newExclusions }))
            }
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleExport} disabled={selectedFiles.size === 0} startIcon={<SaveIcon />}>
              Export Selected Files
            </Button>
            <Tooltip title="Copy to Clipboard">
              <span>
                <Button variant="outlined" onClick={handleCopyToClipboard} disabled={selectedFiles.size === 0} startIcon={<ContentCopyIcon />}>
                  Copy to Clipboard
                </Button>
              </span>
            </Tooltip>
            {selectedFiles.size > 0 && (
              <Typography variant="body2" sx={{ alignSelf: 'center', color: 'text.secondary' }}>
                {selectedFiles.size} file(s) selected
              </Typography>
            )}
          </Box>
        </>
      )}

      {/* Prompt Config Dialog handles both prompt settings and preset saving.
          We pass the prompt config as well as the entire unified config so that
          the dialog can merge changes and then call onPresetSave. */}
      <PromptConfigDialog
        open={promptDialogOpen}
        onClose={() => setPromptDialogOpen(false)}
        config={config.prompt}
        unifiedConfig={config}
        onConfigChange={(newPrompt: PromptConfig) =>
          setConfig(prev => ({ ...prev, prompt: newPrompt }))
        }
        onPresetSave={handlePresetSave}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default App;