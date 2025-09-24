import ApiIcon from '@mui/icons-material/Api';
import ComputerIcon from '@mui/icons-material/Computer';
import KeyIcon from '@mui/icons-material/Key';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WorkIcon from '@mui/icons-material/Work';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAiProvider } from '../contexts/AiProviderContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import ApiKeyDialog from './ApiKeyDialog';

const AppHeader = () => {
  const location = useLocation();
  const { apiKey, clearApiKey, isApiKeyValid } = useApiKey();
  const { hasConfiguredProvider, isProviderValid } = useAiProvider();
  const [anchorEl, setAnchorEl] = useState(null);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

  const isActive = path => {
    return location.pathname === path;
  };

  const handleMenuClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenApiKeyDialog = () => {
    handleMenuClose();
    setApiKeyDialogOpen(true);
  };

  const handleClearApiKey = () => {
    clearApiKey();
    handleMenuClose();
  };

  const aiProviderStatus = hasConfiguredProvider
    ? isProviderValid
      ? 'success'
      : 'warning'
    : 'error';
  const aiProviderStatusText = hasConfiguredProvider
    ? isProviderValid
      ? 'Ready'
      : 'Inactive'
    : 'Not Configured';

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <img src="/logo-white.svg" alt="legacy-use" style={{ height: '24px' }} />
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 0,
              ml: 2,
              mr: 4,
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': {
                color: 'secondary.main',
              },
            }}
          >
            legacy-use
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
            <Tooltip title="Jobs are the individual executions of an API on a target.">
              <Button
                component={RouterLink}
                to="/jobs"
                color={isActive('/jobs') ? 'secondary' : 'inherit'}
                startIcon={<WorkIcon />}
              >
                Jobs
              </Button>
            </Tooltip>
            <Tooltip title="Sessions are hosted connections between a target and the server, used to run jobs on the target.">
              <Button
                component={RouterLink}
                to="/sessions"
                color={isActive('/sessions') ? 'secondary' : 'inherit'}
                startIcon={<ListAltIcon />}
              >
                Sessions
              </Button>
            </Tooltip>
            <Tooltip title="Targets are machines you want to automate. They can be any computer accessible via remote access software.">
              <Button
                component={RouterLink}
                to="/targets"
                color={isActive('/targets') ? 'secondary' : 'inherit'}
                startIcon={<ComputerIcon />}
              >
                Targets
              </Button>
            </Tooltip>
            <Tooltip title="APIs are pre-defined sets of instructions for executing jobs on targets.">
              <Button
                component={RouterLink}
                to="/apis"
                color={isActive('/apis') ? 'secondary' : 'inherit'}
                startIcon={<ApiIcon />}
              >
                APIs
              </Button>
            </Tooltip>
          </Box>

          <Tooltip title={`AI Provider: ${aiProviderStatusText}`}>
            <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
              <PsychologyIcon color={aiProviderStatus} />
            </Box>
          </Tooltip>

          <Tooltip title="API Key Settings">
            <IconButton
              color={isApiKeyValid ? 'success' : 'error'}
              onClick={handleMenuClick}
              size="large"
            >
              <KeyIcon />
            </IconButton>
          </Tooltip>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleOpenApiKeyDialog}>
              {apiKey ? 'Change API Key' : 'Set API Key'}
            </MenuItem>
            {apiKey && <MenuItem onClick={handleClearApiKey}>Clear API Key</MenuItem>}
          </Menu>
        </Toolbar>
      </AppBar>

      <ApiKeyDialog open={apiKeyDialogOpen} onClose={() => setApiKeyDialogOpen(false)} />
    </>
  );
};

export default AppHeader;
