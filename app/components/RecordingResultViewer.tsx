import { Box } from '@mui/material';
import type { RecordingResultResponse } from '../gen/endpoints';

export default function RecordingResultViewer({
  recordingResult,
}: {
  recordingResult: RecordingResultResponse;
}) {
  return (
    <Box>
      <video
        controls
        style={{ maxWidth: '100%', maxHeight: '200px' }}
        src={`data:video/mp4;base64,${recordingResult.base64_video}`}
      >
        <track kind="captions" srcLang="en" label="English captions" />
        Your browser does not support the video tag.
      </video>
    </Box>
  );
}
