import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import ProfilePage from './pages/profile';
import SignupPage from './pages/signup';
import ThemeProvider from './providers/theme';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

export default function CloudApp() {
  return (
    <ThemeProvider>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <SignedIn>
          <ProfilePage />
        </SignedIn>
        <SignedOut>
          <SignupPage />
        </SignedOut>
      </ClerkProvider>
    </ThemeProvider>
  );
}
