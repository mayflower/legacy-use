import { Box, TextField } from '@mui/material';
import React, { useState } from 'react';

const VPNConfigInputField = ({ targetData, validationErrors, loading, handleChange }) => {
  const [dragOver, setDragOver] = useState(false);

  // Convert file to base64
  const fileToBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data:*/*;base64, prefix to get pure base64
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Handle file drop
  const handleFileDrop = async event => {
    event.preventDefault();
    setDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      try {
        const base64Content = await fileToBase64(files[0]);
        // Create a synthetic event to match the expected format
        const syntheticEvent = {
          target: {
            name: 'vpn_config',
            value: base64Content,
          },
        };
        handleChange(syntheticEvent);
      } catch (error) {
        console.error('Error converting file to base64:', error);
      }
    }
  };

  // Handle drag over
  const handleDragOver = event => {
    event.preventDefault();
    setDragOver(true);
  };

  // Handle drag leave
  const handleDragLeave = event => {
    event.preventDefault();
    setDragOver(false);
  };

  // Show 2 input fields for OpenVPN (username and password)
  if (targetData.type === 'rdp+openvpn') {
    return (
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="OpenVPN Username"
          name="vpn_username"
          value={targetData.vpn_username || ''}
          onChange={handleChange}
          error={!!validationErrors.vpn_username}
          helperText={validationErrors.vpn_username || 'OpenVPN username'}
          disabled={loading}
        />
        <TextField
          fullWidth
          label="OpenVPN Password"
          name="vpn_password"
          type="password"
          value={targetData.vpn_password || ''}
          onChange={handleChange}
          error={!!validationErrors.vpn_password}
          helperText={validationErrors.vpn_password || 'OpenVPN password'}
          disabled={loading}
        />
        <TextField
          fullWidth
          label="OpenVPN Config"
          name="vpn_config"
          multiline
          rows={4}
          value={targetData.vpn_config || ''}
          onChange={handleChange}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          disabled={loading}
          helperText="Drag and drop a config file here or paste base64 content"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: dragOver ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
              border: dragOver ? '2px dashed #1976d2' : undefined,
            },
          }}
        />
      </Box>
    );
  }

  // Original single field for other VPN types
  return (
    <TextField
      fullWidth
      label="VPN Config"
      name="vpn_config"
      multiline
      rows={4}
      value={targetData.vpn_config}
      onChange={handleChange}
      error={!!validationErrors.vpn_config}
      helperText={
        validationErrors.vpn_config ||
        'Optional: Provide a Tailscale auth key for automatic connection'
      }
      disabled={loading}
    />
  );
};

export default VPNConfigInputField;
