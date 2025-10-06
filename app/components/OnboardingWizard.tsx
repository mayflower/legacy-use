import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

type OnboardingWizardProps = {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
};

const OnboardingWizard = ({ open, onComplete, onSkip }: OnboardingWizardProps) => {
  const steps = useMemo(
    () => [
      {
        title: 'Welcome to Legacy Use',
        content: (
          <Stack spacing={2}>
            <Typography variant="body1">
              Legacy Use helps you automate workflows through a few core building blocks.
            </Typography>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Target
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A computer you want to automate.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  API
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A prompt describing the automation task you want to run.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Session
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  An instance of legacy-use running on a target.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Job
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A running execution of an API on a session.
                </Typography>
              </Box>
            </Stack>
          </Stack>
        ),
      },
      {
        title: 'Setting Up Your First Target',
        content: (
          <Stack spacing={2}>
            <Typography variant="body1">
              Targets need remote access configured so legacy-use can operate them securely.
            </Typography>
            <Stack spacing={1.5}>
              <Button
                component="a"
                href="https://docs.google.com/document/d/14FuYaEbZLvMHW0FzXbrlaPgjwleD_kTB9ATG5krFlDU/"
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
              >
                Installing UltraVNC
              </Button>
              <Button
                component="a"
                href="https://docs.google.com/document/d/1s-9Qc75tlVaWu1sCExr5-WTUgrRB4hCJFYSYiV_Wp_0/"
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
              >
                Setting up Tailscale
              </Button>
            </Stack>
          </Stack>
        ),
      },
      {
        title: 'Creating Your First API',
        content: (
          <Stack spacing={2}>
            <Typography variant="body1">
              APIs define what should happen when your automation runs.
            </Typography>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Parameters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Insert dynamic values with {'{{parameter_name}}'} placeholders.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Response Example
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Describe the structure of the data you expect back.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Prompt
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Provide step-by-step instructions. Follow HOW_TO_PROMPT guidelines.
                </Typography>
              </Box>
            </Stack>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Prompt best practices
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Keep one action per step, describe expected UI before actions, and prefer keyboard
                shortcuts when possible.
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        title: 'Triggering Your API',
        content: (
          <Stack spacing={2}>
            <Typography variant="body1">
              Run your API once you have a target and prompt ready.
            </Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                1. Open the APIs page and choose your API.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                2. Select a target from the dropdown.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                3. Click execute to start a job.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                4. The job runs on a session instance on that target.
              </Typography>
            </Stack>
            <Typography variant="body1" fontWeight={600}>
              You're all set! Start automating your workflows.
            </Typography>
          </Stack>
        ),
      },
    ],
    [],
  );

  const [activeStep, setActiveStep] = useState(0);
  const totalSteps = steps.length;
  const isLastStep = activeStep === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      setActiveStep(0);
      return;
    }
    setActiveStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    onSkip();
    setActiveStep(0);
  };

  return (
    <Dialog
      open={open}
      fullScreen
      onClose={(_, reason) => {
        if (reason === 'backdropClick') {
          return;
        }
        handleSkip();
      }}
      PaperProps={{
        sx: {
          backgroundColor: '#121212',
          color: 'common.white',
        },
      }}
    >
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Stack spacing={3} sx={{ flexGrow: 1 }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Step {activeStep + 1} of {totalSteps}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>
              {steps[activeStep].title}
            </Typography>
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              backgroundColor: '#1e1e1e',
              borderRadius: 3,
              p: { xs: 3, sm: 4 },
              overflowY: 'auto',
            }}
          >
            {steps[activeStep].content}
          </Box>
        </Stack>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
          <Button color="inherit" onClick={handleSkip} sx={{ color: 'text.secondary' }}>
            Skip Wizard
          </Button>
          <Stack direction="row" spacing={2}>
            <Button onClick={handleBack} disabled={activeStep === 0} variant="outlined">
              Previous
            </Button>
            <Button variant="contained" color="primary" onClick={handleNext}>
              {isLastStep ? 'Get Started' : 'Next'}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
