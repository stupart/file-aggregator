// src/components/TaskInput.tsx
import React from 'react';
import { TextField, Box } from '@mui/material';

interface TaskInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const TaskInput: React.FC<TaskInputProps> = ({
    value,
    onChange,
    placeholder = "Describe the task or changes needed..."
}) => {
    return (
        <Box sx={{ mb: 2 }}>
            <TextField
                fullWidth
                multiline
                rows={3}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                label="Task Description"
                variant="outlined"
            />
        </Box>
    );
};