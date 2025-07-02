import React from 'react';
import { Typography, Box, Paper, Tabs, Tab, Alert, CircularProgress } from '@mui/material';
import LogViewer from './LogViewer';
import HttpExchangeViewer from './HttpExchangeViewer';

const JobTabs = ({
  activeTab,
  handleTabChange,
  job,
  regularLogs,
  httpExchanges,
  httpExchangesLoading,
  hasHttpExchanges,
}) => {
  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Logs" />
          {job.error && <Tab label="Error" />}
          {hasHttpExchanges && <Tab label="HTTP Exchanges" />}
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <LogViewer logs={regularLogs} />
          </Box>
        </Box>
      )}

      {activeTab === 1 && job.error && (
        <Box>
          <Typography variant="subtitle1" gutterBottom color="error">
            Error Details
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            {job.error}
          </Alert>
          {job.error_details && (
            <Box
              sx={{
                backgroundColor: '#2d2d2d',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.9rem',
              }}
            >
              <pre style={{ margin: 0, color: '#ff6b6b' }}>{job.error_details}</pre>
            </Box>
          )}
        </Box>
      )}

      {((job.error && activeTab === 2) || (!job.error && activeTab === 1)) && (
        <Box>
          {httpExchangesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : httpExchanges.length > 0 ? (
            <HttpExchangeViewer exchanges={httpExchanges} />
          ) : (
            <Typography variant="body2" color="textSecondary">
              No HTTP exchanges found for this job.
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default JobTabs;
