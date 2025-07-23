import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importApiDefinition } from '../services/apiService';

const AddApiDialog = ({ open, onClose, onApiAdded }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    setName(e.target.value);
  };

  const handleSubmit = async () => {
    // Validate form
    if (!name.trim()) {
      setError('API name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create minimal API definition object
      const apiDefinition = {
        name: name.trim(),
        description: 'New API',
        prompt: '',
        prompt_cleanup: '',
        parameters: [],
        response_example: {},
      };

      // Import the API definition
      await importApiDefinition(apiDefinition);

      // Notify parent component
      if (onApiAdded) {
        onApiAdded();
      }

      // Close dialog
      onClose();

      // Redirect to edit page
      navigate(`/apis/${name.trim()}/edit`);
    } catch (err) {
      console.error('Error creating API:', err);
      setError(err.response?.data?.detail || 'Failed to create API');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New API</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          name="name"
          label="API Name"
          value={name}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
          helperText="Enter a unique name for the API. You'll be redirected to the edit page to complete the details."
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
          {loading ? 'Creating...' : 'Create & Edit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddApiDialog;
