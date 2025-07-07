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
        For optimal results, we recommend using the standard 1024x768 resolution. Other resolutions
        may result in suboptimal performance, display issues, or compatibility problems with certain
        applications and VNC/RDP clients.
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        <strong>Current:</strong> {width}x{height} |<strong> Recommended:</strong> 1024x768
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={onRecommendedResolutionClick}
          disabled={disabled}
        >
          Use Recommended Resolution (1024x768)
        </Button>
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
