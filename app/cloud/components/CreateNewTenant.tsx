import { useAuth, useUser } from '@clerk/clerk-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type FormEvent, useEffect, useState } from 'react';
import { apiClient } from '../../services/apiService';

type CreateNewTenantProps = {
  onSuccess?: (tenant: { name: string; schema: string; host: string; api_key: string }) => void;
};

type InferredTenant = {
  name: string;
  schema: string;
  host: string;
  api_key: string;
};

function inferTenantDetails(name: string): InferredTenant {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Tenant name is required');
  }

  const slug = trimmedName
    .toLowerCase()
    // Replace any sequence of non-lowercase-alphanumeric characters with a dash
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading or trailing dashes
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    throw new Error('Tenant name must contain alphanumeric characters');
  }

  // Replace all dashes with underscores
  const schema = slug.replace(/-/g, '_');

  const host = `${slug}.${window.location.hostname.replace('cloud.', '')}`;

  return {
    name: trimmedName,
    schema,
    host,
    api_key: '',
  };
}

function handleForwardToNewTenant(host: string, api_key: string) {
  if (host.includes('localhost')) {
    window.open(`http://${host}:${window.location.port}?api_key=${api_key}`, '_blank');
  } else {
    window.open(`https://${host}?api_key=${api_key}`, '_blank');
  }
}

export function CreateNewTenant({ onSuccess }: CreateNewTenantProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [tenantName, setTenantName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<InferredTenant | null>(null);

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const inferred = inferTenantDetails(tenantName);
      const clerkId = user?.id;
      const clerkJwt = await getToken();

      const headers = clerkJwt
        ? {
            Authorization: `Bearer ${clerkJwt}`,
          }
        : undefined;

      const response = await apiClient.post('/tenants/', null, {
        params: { ...inferred, clerk_id: clerkId },
        headers,
      });

      if (response.data.api_key) {
        setSuccess({ ...inferred, api_key: response.data.api_key });
        setTenantName('');
      }

      if (onSuccess) {
        onSuccess(inferred);
      }
    } catch (err) {
      console.log('err', err);
      const detail = err?.response?.data?.detail;
      if (detail) {
        setError(typeof detail === 'string' ? detail : 'Failed to create tenant.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create tenant. Please try again.');
      }
      setSuccess(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetTenant = async () => {
    const response = await apiClient.get('/tenants/');
    return response.data;
  };

  // check if user already has a tenant
  useEffect(() => {
    const fetchTenant = async () => {
      const tenant = await handleGetTenant();
      if (tenant) {
        setSuccess(tenant);
        if (onSuccess) {
          onSuccess(tenant);
        }
      }
    };
    fetchTenant();
  }, []);

  return (
    <Card
      sx={{
        maxWidth: 600,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        borderRadius: 3,
        p: 1.5,
      }}
    >
      <CardContent>
        {!success && (
          <Typography variant="h5" gutterBottom>
            Create your organization
          </Typography>
        )}

        {!success && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Pick a name for your organization. We will generate the technical details for you.
          </Typography>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, mx: 'auto', maxWidth: 400 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {!success ? (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Organization name"
              placeholder="e.g., Acme Corp"
              value={tenantName}
              onChange={event => setTenantName(event.target.value)}
              fullWidth
              required
              disabled={isSubmitting}
              sx={{ mb: 2, maxWidth: 400, mx: 'auto', display: 'block' }}
            />
            <Button type="submit" variant="contained" disabled={isSubmitting || !tenantName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create organization'}
            </Button>
          </form>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              {success.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Host: {success.host}
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleForwardToNewTenant(success.host, success.api_key)}
              sx={{ mt: 1 }}
            >
              Go to organization
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
