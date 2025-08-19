import { useUser } from '@clerk/clerk-react';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Link,
  Stack,
  Typography,
} from '@mui/material';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  const name = user?.fullName || user?.username;

  if (!isLoaded) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Card
            sx={{
              maxWidth: 600,
              width: '100%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Stack spacing={3} alignItems="center">
                {/* Logo */}
                <Box
                  component="img"
                  src="/logo-white.svg"
                  alt="legacy-use logo"
                  sx={{
                    height: 80,
                    width: 'auto',
                    filter: 'brightness(0.1)',
                  }}
                />

                {/* Welcome Message */}
                <Typography variant="h3" component="h1" gutterBottom>
                  Hello, legacy-use!
                </Typography>

                {/* User Information */}
                {user && (
                  <Box>
                    <Stack spacing={2} alignItems="center">
                      <Avatar
                        src={user.imageUrl}
                        alt={user.fullName || user.username || 'User'}
                        sx={{
                          width: 80,
                          height: 80,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                      />

                      <Stack spacing={1} alignItems="center">
                        {name && <Typography variant="h5">{name}</Typography>}

                        {user.primaryEmailAddress && (
                          <Typography variant="body1" color="text.secondary">
                            {user.primaryEmailAddress.emailAddress}
                          </Typography>
                        )}

                        {user.createdAt && (
                          <Chip
                            label={`Member since ${new Date(user.createdAt).toLocaleDateString()}`}
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                )}

                <Typography variant="body1">
                  You're all set, we will send you an email with your credentials shortly.
                </Typography>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                  Start automating work in your desktop applications and expose workflows as modern
                  APIs with our reliable AI agents.
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Check out our <Link href="https://legacy-use.com/docs">documentation</Link> or contact
            our <Link href="mailto:support@legacy-use.com">support team</Link>.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
