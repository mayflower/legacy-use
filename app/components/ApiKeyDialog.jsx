import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { testApiKey } from '../services/apiService';

const ApiKeyDialog = ({ open, onClose }) => {
  const { apiKey, setApiKey, setIsApiKeyValid } = useApiKey();
  const [inputApiKey, setInputApiKey] = useState(apiKey || '');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);

  // Reset input when dialog opens
  useEffect(() => {
    if (open) {
      setInputApiKey(apiKey || '');
      setError('');
    }
  }, [open, apiKey]);

  const handleSave = async () => {
    if (!inputApiKey.trim()) {
      setError('API key cannot be empty');
      return;
    }

    setTesting(true);
    setError('');

    try {
      // Test the API key
      await testApiKey(inputApiKey);

      // If successful, save the API key
      setApiKey(inputApiKey);
      setIsApiKeyValid(true);
      onClose();
    } catch (err) {
      // If the API key is invalid
      setError(
        err.response?.status === 403
          ? 'Invalid API key. Please check and try again.'
          : 'Error connecting to the server. Please try again.',
      );
      setIsApiKeyValid(false);
    } finally {
      setTesting(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = e => {
    if (e.key === 'Enter' && !testing && inputApiKey.trim()) {
      handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={apiKey ? onClose : undefined} // Only allow closing if there's already a valid API key
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!apiKey} // Prevent closing with Escape key if no valid API key
    >
      <DialogTitle>API Key Required</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            Please enter your API key to access the server. The API key will be stored in your
            browser's local storage.
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            The API key is required for all requests. If you reload the page, the API key will be
            retrieved from local storage.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          margin="dense"
          label="API Key"
          type="text"
          fullWidth
          variant="outlined"
          value={inputApiKey}
          onChange={e => setInputApiKey(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={testing}
          placeholder="Enter your API key"
        />
      </DialogContent>
      <DialogActions>
        {apiKey && (
          <Button onClick={onClose} color="primary" disabled={testing}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={testing || !inputApiKey.trim()}
        >
          {testing ? 'Testing...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApiKeyDialog;
