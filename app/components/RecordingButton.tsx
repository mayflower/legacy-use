import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  type RecordingRequest,
  type RecordingResponse,
  RecordingStatus,
  type RecordingStatusResponse,
} from '../gen/endpoints';
import { getRecordingStatus, startRecording, stopRecording } from '../services/apiService';

interface RecordingButtonProps {
  sessionId: string;
}

const recordingOptions: RecordingRequest = {
  framerate: 30,
  quality: 'fast',
  format: 'mp4',
  capture_vnc_input: true,
};

export default function RecordingButton({ sessionId }: RecordingButtonProps) {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatusResponse | null>(null);
  const [recordingResult, setRecordingResult] = useState<RecordingResponse | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getRecordingStatus(sessionId);
      setRecordingStatus(result);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const handleStartRecording = async () => {
    const result = await startRecording(sessionId, recordingOptions);
    setRecordingStatus(result);
  };

  const handleStopRecording = async () => {
    const result = await stopRecording(sessionId);
    setRecordingResult(result);
  };

  if (!recordingStatus) {
    return <div>Loading...</div>;
  }

  const isRecording =
    recordingStatus?.status === RecordingStatus.started ||
    recordingStatus?.status === RecordingStatus.recording;

  return (
    <div>
      {isRecording ? (
        <Button variant="contained" color="error" onClick={handleStopRecording}>
          Stop Recording
        </Button>
      ) : (
        <Button variant="contained" color="error" onClick={handleStartRecording}>
          Start Recording
        </Button>
      )}

      <hr />

      <h2>Recording Status</h2>
      <pre style={{ maxWidth: '500px' }}>{JSON.stringify(recordingStatus, null, 2)}</pre>

      <h2>Recording Result</h2>
      <pre style={{ maxWidth: '500px' }}>{JSON.stringify(recordingResult, null, 2)}</pre>
    </div>
  );
}
