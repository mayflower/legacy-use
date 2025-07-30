import { Cancel, Circle, PlayArrow, Replay } from '@mui/icons-material';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { useContext, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { SessionContext } from '../App';
import type { AnalyzeVideoAiAnalyzePostResult, RecordingResultResponse } from '../gen/endpoints';
import { analyzeVideo } from '../services/apiService';
import { base64ToVideoFile } from '../utils/video';
import RecordingButton from './RecordingButton';
import RecordingResultViewer from './RecordingResultViewer';

export default function InteractiveSession() {
  const { currentSession } = useContext(SessionContext);

  // Recording state
  const [recordingResult, setRecordingResult] = useLocalStorage<null | RecordingResultResponse>(
    `recording-result-${currentSession?.id}`,
    null,
  );

  // Analyze state
  const [analyzeResult, setAnalyzeResult] = useLocalStorage<null | AnalyzeVideoAiAnalyzePostResult>(
    `analyze-result-${currentSession?.id}`,
    null,
  );
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
    handleAnalyzeRecording(recordingResult);
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
            {analyzeResult ? (
              <Button
                onClick={() => {
                  setRecordingResult(null);
                  setAnalyzeResult(null);
                }}
                variant="outlined"
                color="warning"
                startIcon={<Replay />}
              >
                Discard and restart
              </Button>
            ) : recordingResult ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleAnalyzeRecording(recordingResult)}
                  disabled={analyzeProgress}
                  startIcon={analyzeProgress ? <CircularProgress size={16} /> : <Circle />}
                >
                  {analyzeProgress ? 'Analyzing...' : 'Analyze'}
                </Button>
                <Button color="warning" onClick={() => setRecordingResult(null)}>
                  <Cancel />
                </Button>
              </>
            ) : (
              <RecordingButton
                sessionId={currentSession.id}
                onRecordingStopped={onRecordingStopped}
              />
            )}

            {recordingResult && <RecordingResultViewer recordingResult={recordingResult} />}
          </Box>
        </CardContent>
      </Card>

      {analyzeResult && (
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
            <Button variant="contained" color="success" onClick={() => console.log('play')}>
              <PlayArrow />
            </Button>
          </Box>

          {analyzeResult.actions.map(action => (
            <Card key={action.title} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1">{action.title}</Typography>
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
      )}

      {recordingResult && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Recording Result
          </Typography>

          <video
            controls
            style={{ maxWidth: '100%', maxHeight: '200px' }}
            src={`data:video/mp4;base64,${recordingResult.base64_video}`}
          >
            <track kind="captions" srcLang="en" label="English captions" />
            Your browser does not support the video tag.
          </video>
        </Box>
      )}
    </Box>
  );
}
