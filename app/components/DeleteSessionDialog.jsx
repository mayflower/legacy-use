import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import React from 'react';

const DeleteSessionDialog = ({ open, onClose, onConfirm, hardDelete, deleteInProgress }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{hardDelete ? 'Permanently Delete Session?' : 'Archive Session?'}</DialogTitle>
    <DialogContent>
      <DialogContentText>
        {hardDelete
          ? 'This will permanently delete the session and cannot be undone. Are you sure you want to continue?'
          : 'This will archive the session. Archived sessions can be restored later. Do you want to continue?'}
      </DialogContentText>
      {deleteInProgress && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="primary" disabled={deleteInProgress}>
        Cancel
      </Button>
      <Button onClick={onConfirm} color="error" autoFocus disabled={deleteInProgress}>
        {hardDelete ? 'Delete Permanently' : 'Archive'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default DeleteSessionDialog;
