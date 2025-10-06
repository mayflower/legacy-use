import CloseIcon from '@mui/icons-material/Close';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  IconButton,
  Link,
  Toolbar,
  Typography,
} from '@mui/material';
import Stack from '@mui/material/Stack';
import React, { useEffect, useMemo, useState } from 'react';

type OnboardingWizardProps = {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ open, onComplete, onSkip }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo(
    () => [
      {
        title: 'Welcome to Legacy Use',
        description:
          'Legacy Use brings together targets, APIs, and sessions so you can orchestrate automation end to end.',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Here are the three core concepts you will use:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                  Target
                </Typography>
                A computer you want to automate.
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                  API
                </Typography>
                A prompt describing the automation task the agent should execute.
              </Typography>
              <Typography component="li" variant="body1">
                <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                  Session
                </Typography>
                An instance running your automation on a target.
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        title: 'Setting Up Your First Target',
        description: 'Configure remote access so the automation agent can reach your machine.',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Targets need remote access set up before you can launch sessions. Follow these guides to
              prepare your environment:
            </Typography>
            <Stack spacing={1.5}>
              <Link
                href="https://docs.google.com/document/d/14FuYaEbZLvMHW0FzXbrlaPgjwleD_kTB9ATG5krFlDU/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Installing UltraVNC
              </Link>
              <Link
                href="https://docs.google.com/document/d/1s-9Qc75tlVaWu1sCExr5-WTUgrRB4hCJFYSYiV_Wp_0/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Setting up Tailscale
              </Link>
            </Stack>
          </Box>
        ),
      },
      {
        title: 'Creating Your First API',
        description: 'Define prompts that describe what the automation should accomplish.',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              APIs capture your automation logic. Key pieces to fill in:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                  Parameters
                </Typography>
                Dynamic values inserted via <code>{'{{parameter_name}}'}</code> placeholders.
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                  Response Example
                </Typography>
                Describe the expected format for extracted results.
              </Typography>
              <Typography component="li" variant="body1">
                <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>
                  Prompt
                </Typography>
                Provide step-by-step instructions (see <code>HOW_TO_PROMPT.md</code>).
              </Typography>
            </Box>
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Prompt best practices:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                Keep each step focused on a single action.
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                Describe the expected UI before performing actions.
              </Typography>
              <Typography component="li" variant="body1">
                Prefer keyboard shortcuts whenever possible.
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        title: "You're All Set!",
        description: 'You now have everything you need to automate your workflows.',
        content: (
          <Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Create targets, define APIs, and trigger sessions to run your automations whenever you
              need them.
            </Typography>
            <Button variant="contained" color="primary" onClick={onComplete}>
              Get Started
            </Button>
          </Box>
        ),
      },
    ],
    [onComplete],
  );

  useEffect(() => {
    if (!open) {
      setActiveStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (activeStep >= steps.length - 1) {
      onComplete();
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleSkip = () => {
    onSkip();
  };

  const step = steps[activeStep];

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleSkip}
      PaperProps={{
        sx: {
          backgroundColor: '#121212',
          color: 'common.white',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar
          position="static"
          sx={{
            backgroundColor: '#121212',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6">Getting Started</Typography>
            <Button color="inherit" onClick={handleSkip} sx={{ textTransform: 'none' }}>
              Skip Wizard
            </Button>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 3, sm: 6 },
            py: { xs: 6, sm: 8 },
            maxWidth: 720,
            mx: 'auto',
            textAlign: 'left',
          }}
        >
          <Typography variant="overline" color="primary.light" sx={{ mb: 2 }}>
            Step {activeStep + 1} of {steps.length}
          </Typography>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {step.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {step.description}
          </Typography>
          <Box sx={{ width: '100%', color: 'text.primary' }}>{step.content}</Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 3, sm: 6 },
            py: 3,
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          <Button onClick={handleBack} disabled={activeStep === 0} color="inherit">
            Previous
          </Button>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {activeStep + 1} / {steps.length}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              sx={{ textTransform: 'none' }}
            >
              {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </Stack>
        </Box>
      </Box>

      <IconButton
        onClick={handleSkip}
        sx={{ position: 'absolute', top: 16, right: 16, color: 'common.white' }}
        aria-label="Close onboarding wizard"
      >
        <CloseIcon />
      </IconButton>
    </Dialog>
  );
};

export default OnboardingWizard;
