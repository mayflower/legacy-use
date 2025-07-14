import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';

const recommendedResolutions = [
  {
    width: 1024,
    height: 768,
  },
  {
    width: 1280,
    height: 800,
  },
];

const ResolutionRecommendation = ({ width, height, onRecommendedResolutionClick, disabled }) => {
  const isRecommendedResolution = recommendedResolutions.some(
    resolution => resolution.width === width && resolution.height === height,
  );

  if (isRecommendedResolution) {
    return null; // Don't show warning for recommended resolution
  }

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
        Recommended Screen Resolution
      </Typography>
      <Typography variant="body2">
        We recommend using one of the standard resolutions below for the best experience. These
        resolutions are optimized for computer automation tasks and provide better reliability and
        performance.
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
        <strong>Current resolution:</strong> {width} × {height}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Choose a recommended resolution:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {recommendedResolutions.map(({ width, height }) => (
          <Button
            key={`${width}x${height}`}
            variant="outlined"
            size="small"
            onClick={() => onRecommendedResolutionClick({ width, height })}
            disabled={disabled}
          >
            {width} × {height}
          </Button>
        ))}
      </Box>
    </Alert>
  );
};

ResolutionRecommendation.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  onRecommendedResolutionClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ResolutionRecommendation.defaultProps = {
  disabled: false,
};

export default ResolutionRecommendation;
