//src/components/sections/TaskSection.tsx
import React from 'react';
import {
    Box,
    TextField,
    FormControlLabel,
    Switch,
    Typography,
    Paper
} from '@mui/material';

interface TaskSectionProps {
    task: string;
    includeTask: boolean;
    onTaskChange: (task: string) => void;
    onIncludeTaskChange: (include: boolean) => void;
}

export const TaskSection: React.FC<TaskSectionProps> = ({
    task,
    includeTask,
    onTaskChange,
    onIncludeTaskChange
}) => {
    return (
        <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Task Description</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={includeTask}
                            onChange={(e) => onIncludeTaskChange(e.target.checked)}
                        />
                    }
                    label="Include Task"
                />
            </Box>
            <TextField
                fullWidth
                multiline
                rows={4}
                value={task}
                onChange={(e) => onTaskChange(e.target.value)}
                placeholder="Describe what needs to be done..."
                disabled={!includeTask}
                sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
                Describe the specific task, changes, or improvements needed for this code.
            </Typography>
        </Paper>
    );
};