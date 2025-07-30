import { Alert, Box, Card, CardContent, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import { SessionContext } from '../App';
import type { AnalyzeVideoAiAnalyzePostResult, RecordingResultResponse } from '../gen/endpoints';
import { analyzeVideo } from '../services/apiService';
import { base64ToVideoFile } from '../utils/video';
import RecordingButton from './RecordingButton';
import type { RecordingHistory } from './RecordingHistory';

export default function InteractiveSession() {
  const { currentSession } = useContext(SessionContext);

  // Recording state
  const [recordingResult, setRecordingResult] = useState<null | RecordingResultResponse>(null);

  // Analyze state
  const [analyzeResult, setAnalyzeResult] = useState<null | AnalyzeVideoAiAnalyzePostResult>(null);
  const [analyzeError, setAnalyzeError] = useState<null | string>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(false);

  // Save recording history to localStorage
  const saveRecordingHistory = (history: RecordingHistory[]) => {
    if (currentSession?.id) {
      localStorage.setItem(`recording-history-${currentSession.id}`, JSON.stringify(history));
    }
  };

  const handleAnalyzeRecording = async (recording: RecordingHistory) => {
    setAnalyzeProgress(true);
    setAnalyzeError(null);

    try {
      // Check if we have base64 video data
      if (!recording.recordingResult?.base64_video) {
        throw new Error('No video data available for analysis');
      }

      const videoFile = base64ToVideoFile(
        recording.recordingResult.base64_video,
        `recording_${recording.id}.mp4`,
      );

      const analysisResult = await analyzeVideo(videoFile);

      setAnalyzeResult(analysisResult);
      setAnalyzeProgress(false);
      setAnalyzeError(null);
    } catch (err) {
      console.error('Error analyzing recording:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setAnalyzeError(`Failed to analyze recording: ${errorMessage}`);
      setAnalyzeProgress(false);
    }
  };

  if (!currentSession) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No active session selected. Please select a session to use recording features.
        </Alert>
      </Box>
    );
  }

  if (currentSession.is_archived) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          This session is archived. Recording is not available for archived sessions.
        </Alert>
      </Box>
    );
  }

  if (currentSession.state !== 'ready') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Session is not ready. Current state: {currentSession.state}. Recording is only available
          when the session is in 'ready' state.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Interactive Session
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Record your interactions to generate automation workflows and teach legacy-use your use
        cases.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <RecordingButton
              sessionId={currentSession.id}
              onRecordingStopped={setRecordingResult}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
