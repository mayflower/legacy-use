import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { type FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { useAiProvider } from '../contexts/AiProviderContext';
import { updateProviderSettings } from '../services/apiService';

const Settings = () => {
  const { providers, currentProvider, loading, refreshProviders } = useAiProvider();
  const configuredProviders = providers.filter(provider => provider.available);
  const hasProviders = providers.length > 0;
  const activeProviderValue = currentProvider ?? '';
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeModelLabelId = useId();
  const editProviderLabelId = useId();

  useEffect(() => {
    if (!loading && providers.length > 0) {
      setSelectedProviderId(prevId => {
        if (prevId && providers.some(provider => provider.provider === prevId)) {
          return prevId;
        }
        if (currentProvider && providers.some(provider => provider.provider === currentProvider)) {
          return currentProvider;
        }
        return providers[0].provider;
      });
    }
  }, [loading, providers, currentProvider]);

  const selectedProvider = useMemo(
    () => providers.find(provider => provider.provider === selectedProviderId) ?? null,
    [providers, selectedProviderId],
  );

  useEffect(() => {
    if (selectedProvider) {
      const emptyCredentials = Object.keys(selectedProvider.credentials || {}).reduce(
        (acc, key) => ({
          ...acc,
          [key]: '',
        }),
        {} as Record<string, string>,
      );
      setCredentials(emptyCredentials);
      setSaveError(null);
      setSaveSuccess(false);
    } else {
      setCredentials({});
    }
  }, [selectedProvider]);

  const credentialKeys = useMemo(() => {
    if (!selectedProvider) {
      return [];
    }
    return Object.keys(selectedProvider.credentials || {});
  }, [selectedProvider]);

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [key]: value,
    }));
    if (saveError) {
      setSaveError(null);
    }
    if (saveSuccess) {
      setSaveSuccess(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProvider) {
      return;
    }

    const missingField = credentialKeys.find(key => !credentials[key]?.trim());
    if (missingField) {
      setSaveError('All fields are required to update this provider.');
      setSaveSuccess(false);
      return;
    }

    const trimmedCredentials = credentialKeys.reduce(
      (acc, key) => ({
        ...acc,
        [key]: credentials[key].trim(),
      }),
      {} as Record<string, string>,
    );

    setSaving(true);
    setSaveError(null);

    try {
      await updateProviderSettings(selectedProvider.provider, trimmedCredentials);
      setSaveSuccess(true);
      await refreshProviders();
    } catch (error) {
      const message = (error as { response?: { data?: { detail?: string } } })?.response?.data
        ?.detail;
      setSaveError(message || 'Failed to update provider settings.');
      setSaveSuccess(false);
    } finally {
      setSaving(false);
    }
  };

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
            <InputLabel id={activeModelLabelId}>Active AI Model</InputLabel>
            <Select
              labelId={activeModelLabelId}
              id={`${activeModelLabelId}-select`}
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
                No AI models are currently configured. Add provider credentials to enable
                AI-assisted workflows.
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

          {providers.length > 0 && selectedProvider && (
            <Paper
              component="form"
              variant="outlined"
              sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}
              onSubmit={handleSubmit}
            >
              <Typography variant="h6">Configure AI Provider</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a provider and enter new credentials to update and activate it.
              </Typography>

              <FormControl fullWidth>
                <InputLabel id={editProviderLabelId}>Provider</InputLabel>
                <Select
                  labelId={editProviderLabelId}
                  id={`${editProviderLabelId}-select`}
                  label="Provider"
                  value={selectedProviderId}
                  onChange={(event: SelectChangeEvent<string>) =>
                    setSelectedProviderId(event.target.value)
                  }
                >
                  {providers.map(provider => (
                    <MenuItem key={provider.provider} value={provider.provider}>
                      {provider.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack spacing={2}>
                {credentialKeys.length === 0 ? (
                  <Typography color="text.secondary">
                    This provider does not require any credentials.
                  </Typography>
                ) : (
                  credentialKeys.map(key => {
                    const placeholder = selectedProvider.credentials?.[key] ?? '';
                    const isSecret =
                      key.toLowerCase().includes('key') || key.toLowerCase().includes('secret');
                    return (
                      <TextField
                        key={key}
                        label={key}
                        type={isSecret ? 'password' : 'text'}
                        value={credentials[key] ?? ''}
                        onChange={event => handleCredentialChange(key, event.target.value)}
                        placeholder={placeholder || undefined}
                        fullWidth
                        autoComplete="off"
                        helperText={
                          placeholder
                            ? 'Current value hidden. Enter a new value to replace it.'
                            : undefined
                        }
                      />
                    );
                  })
                )}
              </Stack>

              {saveError && <Alert severity="error">{saveError}</Alert>}
              {saveSuccess && <Alert severity="success">Provider updated successfully.</Alert>}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? 'Saving…' : 'Save and Activate'}
                </Button>
              </Box>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default Settings;
