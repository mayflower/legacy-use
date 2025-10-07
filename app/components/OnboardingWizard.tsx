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
  const mediaStyles = {
    width: '100%',
    maxWidth: 420,
    borderRadius: 2,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
    objectFit: 'cover',
  } as const;

  const steps = useMemo(
    () => [
      {
        title: 'Welcome to Legacy Use',
        content: (
          <Stack spacing={2.5} alignItems="center" sx={{ maxWidth: 520, mx: 'auto' }}>
            <Typography variant="body1" fontWeight="bold" textAlign={'center'}>
              Legacy Use helps you automate workflows on any computer through a few core building blocks.
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" textAlign={'center'} fontWeight={600}>
                  🖥️ Target
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign={'center'}>
                  A computer you want to automate a workflow on.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} textAlign={'center'}>
                  ⚡ API
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign={'center'}>
                  A prompt describing the workflow you want to run.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} textAlign={'center'}>
                  🗂️ Session
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign={'center'}>
                  An instance of legacy-use running on a target.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600} textAlign={'center'}>
                  🏃 Job
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign={'center'}>
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
          <Stack
            spacing={{ xs: 2.5, md: 4 }}
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'center', md: 'flex-start' }}
            sx={{ maxWidth: 920, mx: 'auto', width: '100%' }}
          >
            <Stack spacing={1.5} sx={{ flex: 1, width: '100%' }}>
              <Typography variant="body1">
                Targets need remote access configured so legacy-use can operate them securely.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capture these details when you create a target:
              </Typography>
              <Stack
                component="ul"
                spacing={1}
                sx={{
                  pl: 2,
                  m: 0,
                  listStyleType: 'disc',
                  '& > li': { display: 'list-item' },
                }}
              >
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Name
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add whatever label helps you recognize the machine.
                  </Typography>
                </Box>
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Type
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select the screen sharing protocol and note if you pair it with a VPN.
                  </Typography>
                </Box>
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    VPN Config
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Include details such as your Tailscale auth key when you connect via VPN.
                  </Typography>
                </Box>
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    VNC/RDP Username
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Provide the username required by the screen sharing protocol.
                  </Typography>
                </Box>
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    VNC/RDP Password
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter the password the protocol uses.
                  </Typography>
                </Box>
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Width/Height
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Specify the screen resolution exposed over VNC or RDP.
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={1.5} pt={4}>
                <Typography variant="body2" color="text.secondary">
                  These guides show you how to setup a target with VNC and Tailscale:
                </Typography>
                <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }} flexWrap="wrap" useFlexGap>
                  <Button
                    component="a"
                    href="https://docs.google.com/document/d/14FuYaEbZLvMHW0FzXbrlaPgjwleD_kTB9ATG5krFlDU/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Installing UltraVNC
                  </Button>
                  <Button
                    component="a"
                    href="https://docs.google.com/document/d/1s-9Qc75tlVaWu1sCExr5-WTUgrRB4hCJFYSYiV_Wp_0/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Setting up Tailscale
                  </Button>
                </Stack>
              </Stack>
            </Stack>
            <Box
              component="img"
              src="https://onboarding-gif.s3.eu-central-1.amazonaws.com/Target.gif"
              alt="Target setup walkthrough"
              sx={{ ...mediaStyles, alignSelf: { xs: 'center', md: 'flex-start' } }}
            />
          </Stack>
        ),
      },
      {
        title: 'Creating Your First API',
        content: (
          <Stack
            spacing={{ xs: 2.5, md: 4 }}
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'center', md: 'flex-start' }}
            sx={{ maxWidth: 920, mx: 'auto', width: '100%' }}
          >
            <Stack spacing={1.5} sx={{ flex: 1, width: '100%' }}>
              <Typography variant="body1">
                APIs define what should happen when your automation runs.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure each part to describe the workflow and its inputs:
              </Typography>
              <Stack
                component="ul"
                spacing={1}
                sx={{
                  pl: 2,
                  m: 0,
                  listStyleType: 'disc',
                  '& > li': { display: 'list-item' },
                }}
              >
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Parameters
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pass dynamic values into the workflow and inject them into prompts with {'{{parameter_name}}'} placeholders.
                  </Typography>
                </Box>
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Prompt Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This is the most important part. Describe the workflow you want to automate, step by step, in natural language.
                  </Typography>
                </Box>
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Cleanup Prompt
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Optionally add instructions to reset the desktop after the workflow, like closing open windows.
                  </Typography>
                </Box>
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Response Example
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Outline the JSON structure you expect to receive back.
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  Detailed instructions on how to write a good prompt:
                </Typography>
                <Button
                  component="a"
                  href="https://github.com/legacy-use/legacy-use/blob/main/HOW_TO_PROMPT.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ alignSelf: { xs: 'stretch', sm: 'start' } }}
                >
                  HOW_TO_PROMPT
                </Button>
              </Stack>
            </Stack>
            <Box
              component="img"
              src="https://onboarding-gif.s3.eu-central-1.amazonaws.com/API.gif"
              alt="API creation walkthrough"
              sx={{ ...mediaStyles, alignSelf: { xs: 'center', md: 'flex-start' } }}
            />
          </Stack>
        ),
      },
      {
        title: 'Triggering Your API',
        content: (
          <Stack
            spacing={{ xs: 2.5, md: 4 }}
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'center', md: 'flex-start' }}
            sx={{ maxWidth: 920, mx: 'auto', width: '100%' }}
          >
            <Stack spacing={1.5} sx={{ flex: 1, width: '100%' }}>
              <Typography variant="body1">
                Run your API once you have a target and prompt ready.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Launch your first automation with these steps:
              </Typography>
              <Stack
                component="ul"
                spacing={1}
                sx={{
                  pl: 2,
                  m: 0,
                  listStyleType: 'disc',
                  '& > li': { display: 'list-item' },
                }}
              >
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Choose Your API
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open the APIs page and pick the workflow you want to run.
                  </Typography>
                </Box>
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Select a Target
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use the target dropdown to choose the machine that has the required session setup.
                  </Typography>
                </Box>
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Execute the Job
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click execute to spin up a session and run the automation on that target.
                  </Typography>
                </Box>
                <Box component="li" sx={{ pl: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Monitor the Run
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Watch the live stream and review job output to confirm the workflow completes as expected.
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body1" fontWeight={600}>
                You're all set - trigger your API and start automating!
              </Typography>
            </Stack>
            <Box
              component="img"
              src="https://onboarding-gif.s3.eu-central-1.amazonaws.com/Job.gif"
              alt="Job execution walkthrough"
              sx={{ ...mediaStyles, alignSelf: { xs: 'center', md: 'flex-start' } }}
            />
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
      slotProps={{
        paper: {
          sx: {
            backgroundColor: '#121212',
            color: 'common.white',
          },
        },
      }}
    >
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          p: { xs: 3, sm: 6 },
          background: 'radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 55%)',
        }}
      >
        <Stack spacing={3.5} sx={{ flexGrow: 1 }}>
          <Box textAlign="center">
            <Typography variant="overline" color="text.secondary">
              Step {activeStep + 1} of {totalSteps}
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: 600 }}>
              {steps[activeStep].title}
            </Typography>
          </Box>
          <Box
            sx={{
              flexGrow: 1,
              backgroundColor: 'rgba(20, 24, 29, 0.92)',
              borderRadius: 3,
              // maxWidth: '75%',
              p: { xs: 3, sm: 4 },
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
            }}
          >
            {steps[activeStep].content}
          </Box>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
          <Button color="inherit" onClick={handleSkip} sx={{ color: 'text.secondary' }}>
            Skip Wizard
          </Button>
          <Stack direction="row" spacing={2}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
              sx={{ minWidth: 120 }}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              sx={{ minWidth: 140 }}
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
