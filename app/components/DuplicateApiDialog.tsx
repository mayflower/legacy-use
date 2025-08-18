import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiDefinitionDetails, importApiDefinition } from '../services/apiService';

const DuplicateApiDialog = ({ open, onClose, onApiDuplicated, apiName }) => {
  const navigate = useNavigate();
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = e => {
    setNewName(e.target.value);
  };

  const handleSubmit = async () => {
    // Validate form
    if (!newName.trim()) {
      setError('New API name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get the original API definition
      const originalApiDefinition: any = await getApiDefinitionDetails(apiName);

      // Create duplicated API definition with the new name
      const duplicatedApiDefinition = {
        name: newName.trim(),
        description: originalApiDefinition.description || '',
        parameters: originalApiDefinition.parameters || [],
        prompt: originalApiDefinition.prompt || '',
        prompt_cleanup: originalApiDefinition.prompt_cleanup || '',
        response_example: originalApiDefinition.response_example || {},
      };

      // Import the API definition (creates a new one)
      await importApiDefinition(duplicatedApiDefinition);

      // Notify parent component
      if (onApiDuplicated) {
        onApiDuplicated();
      }

      // Close dialog
      onClose();

      // Redirect to edit page for the new API
      navigate(`/apis/${newName.trim()}/edit`);
    } catch (err) {
      console.error('Error duplicating API:', err);
      setError(err.response?.data?.detail || 'Failed to duplicate API');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Duplicate API</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          name="newName"
          label="New API Name"
          value={newName}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
          helperText={`Enter a unique name for the duplicated API. This will create a copy of '${apiName}'.`}
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Duplicating...' : 'Duplicate & Edit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DuplicateApiDialog;
