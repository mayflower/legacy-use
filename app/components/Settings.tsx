import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import { useAiProvider } from '../contexts/AiProviderContext';

const Settings = () => {
  const { providers, currentProvider, loading } = useAiProvider();
  const configuredProviders = providers.filter(provider => provider.available);
  const hasProviders = providers.length > 0;
  const activeProviderValue = currentProvider ?? '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review the AI providers available to this deployment.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body1">Loading AI provider configuration...</Typography>
        </Box>
      ) : (
        <>
          <FormControl fullWidth disabled={!hasProviders}>
            <InputLabel id="active-ai-model-label">Active AI Model</InputLabel>
            <Select
              labelId="active-ai-model-label"
              id="active-ai-model"
              label="Active AI Model"
              value={hasProviders ? activeProviderValue : ''}
              disabled
            >
              {providers.map(provider => (
                <MenuItem key={provider.provider} value={provider.provider}>
                  {provider.name}
                </MenuItem>
              ))}
              {!hasProviders && (
                <MenuItem value="" disabled>
                  No providers available
                </MenuItem>
              )}
            </Select>
          </FormControl>

          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Configured AI Models
            </Typography>
            {configuredProviders.length === 0 ? (
              <Typography color="text.secondary">
                No AI models are currently configured. Add provider credentials to enable AI-assisted
                workflows.
              </Typography>
            ) : (
              <Box
                component="ul"
                sx={{
                  listStyle: 'none',
                  m: 0,
                  p: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {configuredProviders.map(provider => (
                  <Box
                    key={provider.provider}
                    component="li"
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    <Typography variant="subtitle1">{provider.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {provider.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Default model: ${provider.default_model}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip label={provider.provider} size="small" variant="outlined" />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Settings;
