import { CheckCircle, History } from '@mui/icons-material';
import { Box, Button, CircularProgress, IconButton, Popover, Typography } from '@mui/material';
import { useState } from 'react';
import { formatDuration } from '../utils/formatDuration';

// Recording states
type RecordingState = 'initial' | 'recording' | 'recorded' | 'analyzed';

export interface RecordingHistory {
  id: string;
  timestamp: Date;
  duration?: number;
  status: RecordingState;
  prompt?: string;
  recordingResult?: any;
  apiDefinition?: any;
  analysisResult?: any;
  apiDefinitionSaved?: boolean;
  apiDefinitionName?: string;
}

interface RecordingHistoryProps {
  recordingHistory: RecordingHistory[];
  onSaveApiDefinition: (recording: RecordingHistory) => void;
  savingApiDefinition: boolean;
}

export default function RecordingHistoryComponent({
  recordingHistory,
  onSaveApiDefinition,
  savingApiDefinition,
}: RecordingHistoryProps) {
  const [historyPopoverAnchor, setHistoryPopoverAnchor] = useState<HTMLElement | null>(null);

  const handleShowRecordingHistory = (event: React.MouseEvent<HTMLElement>) => {
    setHistoryPopoverAnchor(event.currentTarget);
  };

  const handleCloseHistoryPopover = () => {
    setHistoryPopoverAnchor(null);
  };

  // Don't render if no history
  if (recordingHistory.length === 0) {
    return null;
  }

  return (
    <>
      <IconButton
        color="primary"
        onClick={handleShowRecordingHistory}
        size="small"
        sx={{
          border: '1px solid',
          borderColor: 'primary.main',
          opacity: 0.7,
          '&:hover': { opacity: 1 },
        }}
      >
        <History fontSize="small" />
      </IconButton>

      <Popover
        open={Boolean(historyPopoverAnchor)}
        anchorEl={historyPopoverAnchor}
        onClose={handleCloseHistoryPopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, minWidth: 320, maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Recording History
          </Typography>

          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {recordingHistory.map(recording => (
              <Box
                key={recording.id}
                sx={{
                  p: 1.5,
                  mb: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: recording.status === 'analyzed' ? 'success.dark' : 'background.paper',
                  opacity: recording.status === 'analyzed' ? 0.9 : 0.7,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.5,
                  }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {recording.status === 'initial' && 'Not Started'}
                    {recording.status === 'recording' && 'Recording...'}
                    {recording.status === 'recorded' && 'Recorded'}
                    {recording.status === 'analyzed' && 'Analyzed'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {recording.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" display="block">
                  Duration: {formatDuration(recording.duration || 0)}
                </Typography>

                {recording.status === 'analyzed' && recording.apiDefinition && (
                  <Box
                    sx={{
                      mt: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="caption" color="success.light">
                      API: {recording.apiDefinition.name}
                    </Typography>
                    {!recording.apiDefinitionSaved && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onSaveApiDefinition(recording)}
                        disabled={savingApiDefinition}
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                        startIcon={savingApiDefinition ? <CircularProgress size={12} /> : undefined}
                      >
                        {savingApiDefinition ? 'Saving...' : 'Save'}
                      </Button>
                    )}
                    {recording.apiDefinitionSaved && (
                      <CheckCircle sx={{ fontSize: 16, color: 'success.light' }} />
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
