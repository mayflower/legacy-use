import { PlayArrow } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { useState } from 'react';
import {
  type AnalyzeVideoAiAnalyzePostResult,
  executeWorkflowInteractiveSessionsSessionIdWorkflowPost,
  type Session,
} from '../gen/endpoints';

export default function InteractiveBuilder({
  currentSession,
  analyzeResult,
}: {
  currentSession: Session;
  analyzeResult: AnalyzeVideoAiAnalyzePostResult;
}) {
  const [executeProgress, setExecuteProgress] = useState(false);

  const handleInteractiveExecute = async () => {
    setExecuteProgress(true);
    await executeWorkflowInteractiveSessionsSessionIdWorkflowPost(currentSession.id, {
      steps: analyzeResult?.actions ?? [],
    });
    setExecuteProgress(false);
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5">Actions</Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<PlayArrow />}
          onClick={handleInteractiveExecute}
          disabled={executeProgress}
        >
          {executeProgress ? 'Executing...' : 'Execute'}
        </Button>
      </Box>

      {analyzeResult.actions.map(action => (
        <Card key={action.title} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">{action.title}</Typography>
              <Typography fontSize={12} fontFamily="monospace" color="text.secondary">
                {action.tool}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {action.instruction}
            </Typography>
          </CardContent>
        </Card>
      ))}

      <Typography variant="h5" sx={{ mb: 2 }}>
        Parameters
      </Typography>
      {analyzeResult.parameters.map(parameter => (
        <Card key={parameter.name} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1">
              {parameter.name}: {parameter.type}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {parameter.description}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
