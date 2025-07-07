import {
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
  Key as KeyIcon,
  Rocket as RocketIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogContent,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { getProviders, testApiKey } from '../services/apiService';

const OnboardingWizard = ({ open, onClose, onComplete }) => {
  const { setApiKey, setIsApiKeyValid } = useApiKey();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [_providerCredentials, _setProviderCredentials] = useState({});

  // Signup form state
  const [signupData, setSignupData] = useState({
    email: '',
    description: '',
    referralCode: '',
  });

  // Provider configuration state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [awsCredentials, setAwsCredentials] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
  });
  const [vertexCredentials, setVertexCredentials] = useState({
    projectId: '',
    region: 'us-central1',
  });

  const steps = ['Welcome', 'Get Started', 'Configure Provider'];

  // Fetch providers on component mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const providersData = await getProviders();
        setProviders(providersData.providers || []);

        // Set default provider to first available one
        const availableProvider = providersData.providers?.find(p => p.available);
        if (availableProvider) {
          setSelectedProvider(availableProvider.provider);
        } else if (providersData.providers?.length > 0) {
          setSelectedProvider(providersData.providers[0].provider);
        }
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Failed to load provider configurations');
      }
    };

    if (open) {
      fetchProviders();
    }
  }, [open]);

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSignupSubmit = async () => {
    if (!signupData.email || !signupData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Here you would typically make an API call to your signup endpoint
      // For now, we'll simulate success and move to the next step
      console.log('Signup data:', signupData);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      handleNext();
    } catch (_err) {
      setError('Failed to process signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSetup = async () => {
    if (!selectedProvider) {
      setError('Please select a provider');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let credentials = {};

      if (selectedProvider === 'anthropic') {
        if (!apiKeyInput.trim()) {
          setError('Please enter your Anthropic API key');
          return;
        }
        credentials.api_key = apiKeyInput;

        // Test the API key
        await testApiKey(apiKeyInput);
        setApiKey(apiKeyInput);
        setIsApiKeyValid(true);
      } else if (selectedProvider === 'bedrock') {
        if (!awsCredentials.accessKeyId || !awsCredentials.secretAccessKey) {
          setError('Please enter your AWS credentials');
          return;
        }
        credentials = awsCredentials;
      } else if (selectedProvider === 'vertex') {
        if (!vertexCredentials.projectId) {
          setError('Please enter your Google Cloud Project ID');
          return;
        }
        credentials = vertexCredentials;
      }

      // Here you would typically save the provider configuration
      console.log('Provider setup:', { provider: selectedProvider, credentials });

      // Complete the onboarding
      onComplete();
    } catch (_err) {
      setError('Failed to configure provider. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeStep = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <RocketIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Legacy Use
      </Typography>
      <Typography variant="h6" color="text.secondary" paragraph>
        Automate any software with AI-powered computer use
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        paragraph
        sx={{ maxWidth: 600, mx: 'auto' }}
      >
        Legacy Use enables you to automate complex software workflows using advanced AI that can see
        and interact with your applications just like a human would.
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button variant="contained" size="large" onClick={handleNext} sx={{ mr: 2 }}>
          Get Started
        </Button>
      </Box>
    </Box>
  );

  const renderSignupStep = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        Get Started with $5 Credits for free
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph align="center" sx={{ mb: 4 }}>
        Sign up with your email to receive $5 in credits for free to explore Legacy Use's automation
        capabilities.
      </Typography>

      {/* Main signup section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CreditCardIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Signup for Credits</Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              required
              value={signupData.email}
              onChange={e => setSignupData(prev => ({ ...prev, email: e.target.value }))}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="What software do you want to automate?"
              multiline
              rows={3}
              required
              value={signupData.description}
              onChange={e => setSignupData(prev => ({ ...prev, description: e.target.value }))}
              variant="outlined"
              placeholder="e.g., Automate data entry in Excel, manage social media posts, process invoices..."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Referral Code (Optional)"
              value={signupData.referralCode}
              onChange={e => setSignupData(prev => ({ ...prev, referralCode: e.target.value }))}
              variant="outlined"
              placeholder="Enter referral code if you have one"
            />
          </Grid>
        </Grid>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSignupSubmit}
          disabled={loading}
          sx={{ mt: 3 }}
        >
          {loading ? 'Processing...' : 'Sign Up for $5 Credits'}
        </Button>
      </Paper>

      {/* Divider */}
      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {/* Secondary option */}
      <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SettingsIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="h6">Configure Your Own Keys</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          Already have API keys? Skip the credits and configure your own provider credentials.
        </Typography>
        <Button variant="outlined" onClick={handleNext} startIcon={<KeyIcon />}>
          Configure Provider
        </Button>
      </Paper>
    </Box>
  );

  const renderProviderStep = () => (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        Configure AI Provider
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph align="center" sx={{ mb: 4 }}>
        Select and configure your preferred AI provider to power Legacy Use
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>AI Provider</InputLabel>
        <Select
          value={selectedProvider}
          onChange={e => setSelectedProvider(e.target.value)}
          label="AI Provider"
        >
          {providers.map(provider => (
            <MenuItem key={provider.provider} value={provider.provider}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Box>
                  <Typography variant="body1">{provider.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {provider.description}
                  </Typography>
                </Box>
                {provider.available && <Chip label="Configured" color="success" size="small" />}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Provider-specific configuration */}
      {selectedProvider === 'anthropic' && (
        <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Anthropic Configuration
          </Typography>
          <TextField
            fullWidth
            label="API Key"
            type="password"
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            variant="outlined"
            placeholder="Enter your Anthropic API key"
            helperText="You can get your API key from the Anthropic Console"
          />
        </Paper>
      )}

      {selectedProvider === 'bedrock' && (
        <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            AWS Bedrock Configuration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Access Key ID"
                value={awsCredentials.accessKeyId}
                onChange={e =>
                  setAwsCredentials(prev => ({ ...prev, accessKeyId: e.target.value }))
                }
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Secret Access Key"
                type="password"
                value={awsCredentials.secretAccessKey}
                onChange={e =>
                  setAwsCredentials(prev => ({ ...prev, secretAccessKey: e.target.value }))
                }
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Region"
                value={awsCredentials.region}
                onChange={e => setAwsCredentials(prev => ({ ...prev, region: e.target.value }))}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {selectedProvider === 'vertex' && (
        <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Google Vertex AI Configuration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project ID"
                value={vertexCredentials.projectId}
                onChange={e =>
                  setVertexCredentials(prev => ({ ...prev, projectId: e.target.value }))
                }
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Region"
                value={vertexCredentials.region}
                onChange={e => setVertexCredentials(prev => ({ ...prev, region: e.target.value }))}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleProviderSetup}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? 'Configuring...' : 'Complete Setup'}
      </Button>
    </Box>
  );

  const renderStepContent = step => {
    switch (step) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderSignupStep();
      case 2:
        return renderProviderStep();
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>

          <Container maxWidth="sm" sx={{ py: 4 }}>
            {/* Stepper */}
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {steps.map(label => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Step Content */}
            {renderStepContent(activeStep)}

            {/* Navigation */}
            {activeStep > 0 && activeStep < steps.length && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button onClick={handleBack} disabled={loading}>
                  Back
                </Button>
                <Box /> {/* Spacer */}
              </Box>
            )}
          </Container>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
