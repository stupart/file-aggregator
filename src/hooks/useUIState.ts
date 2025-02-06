//src/hooks/useUIState.ts
import { useState } from 'react';

export const useUIState = () => {
    const [configDialogOpen, setConfigDialogOpen] = useState(false);
    const [presetDialogOpen, setPresetDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const showSnackbar = (message: string) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    return {
        configDialogOpen,
        setConfigDialogOpen,
        presetDialogOpen,
        setPresetDialogOpen,
        snackbarOpen,
        setSnackbarOpen,
        snackbarMessage,
        showSnackbar
    };
};