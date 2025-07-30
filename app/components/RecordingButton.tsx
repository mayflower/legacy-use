import { useEffect, useState } from 'react';
import type { RecordingStatusResponse } from '../gen/endpoints';
import { getRecordingStatus } from '../services/apiService';

interface RecordingButtonProps {
  sessionId: string;
}

export default function RecordingButton({ sessionId }: RecordingButtonProps) {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatusResponse | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getRecordingStatus(sessionId);
      setRecordingStatus(result);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div>
      RecordingButton
      <pre>{JSON.stringify(recordingStatus, null, 2)}</pre>
    </div>
  );
}
