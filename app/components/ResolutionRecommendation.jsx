import { Alert, Box, Button, Typography } from '@mui/material';
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
        Resolution Recommendation
      </Typography>
      <Typography variant="body2">
        For optimal results, we recommend using 1024x768 or 1280x800 resolution. Other resolutions
        may result in suboptimal performance and reduced reliability.
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        <strong>Current:</strong> {width}x{height}
      </Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        {recommendedResolutions.map(({ width, height }) => (
          <Button
            key={`${width}x${height}`}
            variant="outlined"
            size="small"
            onClick={() => onRecommendedResolutionClick({ width, height })}
            disabled={disabled}
          >
            Use {width} x {height}
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
