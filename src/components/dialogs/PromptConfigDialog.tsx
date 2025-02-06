/* src/components/dialogs/PromptConfigDialog.tsx */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  TextField,
  FormGroup,
  FormControlLabel,
  Box,
  Stack,
  Typography,
  Divider
} from '@mui/material';
import { PromptConfig } from '../../types/config';
import { AIREADMEConfig } from '../../types/unifiedConfig';

export interface PromptConfigDialogProps {
  open: boolean;
  onClose: () => void;
  // The prompt section of the unified config
  config: PromptConfig;
  // The full unified config snapshot so we can save a preset that includes exclusions, outputFormat, etc.
  unifiedConfig: AIREADMEConfig;
  // Handler to update the prompt portion in the parent unified config
  onConfigChange: (config: PromptConfig) => void;
  // Callback to be invoked when saving a preset.
  // We pass the preset’s name and a new unified config snapshot.
  onPresetSave?: (preset: { name: string; unifiedConfig: AIREADMEConfig }) => void;
}

export const PromptConfigDialog: React.FC<PromptConfigDialogProps> = ({
  open,
  onClose,
  config,
  unifiedConfig,
  onConfigChange,
  onPresetSave,
}) => {
  // Local state for editing prompt settings and preset name.
  const [localConfig, setLocalConfig] = useState<PromptConfig>(config);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    if (open) {
      setLocalConfig(config);
      setPresetName('');
    }
  }, [config, open]);

  const handleChange = (field: keyof PromptConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    // Update the parent's prompt config
    onConfigChange(localConfig);
    // Merge the updated prompt settings into the existing unified config.
    const newUnifiedConfig: AIREADMEConfig = { ...unifiedConfig, prompt: localConfig };
    // Fire the preset save callback if provided.
    if (onPresetSave) {
      onPresetSave({ name: presetName.trim(), unifiedConfig: newUnifiedConfig });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
        Prompt & Preset Configuration
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} paddingY={1}>
          {/* Basic Options */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Basic Options
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.includeFileTree}
                    onChange={e => handleChange('includeFileTree', e.target.checked)}
                  />
                }
                label="Include File Tree"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.includeIdentity}
                    onChange={e => handleChange('includeIdentity', e.target.checked)}
                  />
                }
                label="Include Identity"
              />
              {localConfig.includeIdentity && (
                <TextField
                  label="Your Identity"
                  fullWidth
                  value={localConfig.identity || ''}
                  onChange={e => handleChange('identity', e.target.value)}
                  margin="normal"
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.includeProject}
                    onChange={e => handleChange('includeProject', e.target.checked)}
                  />
                }
                label="Include Project Info"
              />
            </FormGroup>
          </Box>
          <Divider />
          {/* Task & Extras */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Task & Extras
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.includeTask}
                    onChange={e => handleChange('includeTask', e.target.checked)}
                  />
                }
                label="Include Task"
              />
              {localConfig.includeTask && (
                <TextField
                  label="Task Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={localConfig.task || ''}
                  onChange={e => handleChange('task', e.target.value)}
                  margin="normal"
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.addFileHeaders}
                    onChange={e => handleChange('addFileHeaders', e.target.checked)}
                  />
                }
                label="Add File Headers"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.generatePseudocode}
                    onChange={e => handleChange('generatePseudocode', e.target.checked)}
                  />
                }
                label="Generate Pseudocode"
              />
            </FormGroup>
          </Box>
          <Divider />
          {/* Preset Save Section */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Save as Preset
            </Typography>
            <TextField
              label="Preset Name"
              fullWidth
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              margin="normal"
            />
            <Typography variant="caption" color="text.secondary">
              Enter a name and click “Save Preset” to store your current configuration.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', paddingBottom: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSavePreset}
          variant="contained"
          color="primary"
          disabled={!presetName.trim()}
        >
          Save Preset
        </Button>
      </DialogActions>
    </Dialog>
  );
};