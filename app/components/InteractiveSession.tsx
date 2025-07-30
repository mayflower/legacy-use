import { Alert, Box, Card, CardContent, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import { SessionContext } from '../App';
import type { AnalyzeVideoAiAnalyzePostResult, RecordingResultResponse } from '../gen/endpoints';
import { analyzeVideo } from '../services/apiService';
import { base64ToVideoFile } from '../utils/video';
import RecordingButton from './RecordingButton';

export default function InteractiveSession() {
  const { currentSession } = useContext(SessionContext);

  // Recording state
  const [recordingResult, setRecordingResult] = useState<null | RecordingResultResponse>(null);

  // Analyze state
  const [analyzeResult, setAnalyzeResult] = useState<null | AnalyzeVideoAiAnalyzePostResult>(null);
  const [analyzeError, setAnalyzeError] = useState<null | string>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(false);

  const handleAnalyzeRecording = async (recording: RecordingResultResponse) => {
    setAnalyzeProgress(true);
    setAnalyzeError(null);

    try {
      const videoFile = base64ToVideoFile(
        recording.base64_video,
        `recording_${recording.recording_id}.mp4`,
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

  const onRecordingStopped = (recordingResult: RecordingResultResponse) => {
    setRecordingResult(recordingResult);
    // handleAnalyzeRecording(recordingResult);
  };

  if (!currentSession || currentSession.is_archived || currentSession.state !== 'ready') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Please select a session which is ready to use recording features.
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
              onRecordingStopped={onRecordingStopped}
            />
          </Box>
        </CardContent>
      </Card>

      {recordingResult && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Recording Result
          </Typography>

          <video src={recordingResult.base64_video} muted>
            <track kind="captions" />
          </video>
        </Box>
      )}
    </Box>
  );
}
