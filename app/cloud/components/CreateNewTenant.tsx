import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type FormEvent, useState } from 'react';
import { apiClient } from '../../services/apiService';

import { useUser, useAuth } from '@clerk/clerk-react';

type CreateNewTenantProps = {
  onSuccess?: (tenant: { name: string; schema: string; host: string; api_key: string }) => void;
};

type InferredTenant = {
  name: string;
  schema: string;
  host: string;
  api_key: string;
};

const RESERVED_SCHEMA_NAMES = new Set(['cloud', 'www', 'admin', 'local', 'api', 'signup', 'auth']);

function inferTenantDetails(name: string): InferredTenant {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Tenant name is required');
  }

  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    throw new Error('Tenant name must contain alphanumeric characters');
  }

  const schema = slug.replace(/-/g, '_');
  if (RESERVED_SCHEMA_NAMES.has(schema)) {
    throw new Error('Please choose a different name for your tenant');
  }

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
    } catch (err: any) {
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

  return (
    <Card sx={{ maxWidth: 600, width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Typography variant="h5">Create your tenant</Typography>
            <Typography variant="body2" color="text.secondary">
              Pick a name for this tenant. We will generate the technical details for you based on the name.
            </Typography>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" onClose={() => setSuccess(null)}>
                {`Tenant created! Schema: ${success.schema}, Host: ${success.host}`}
              </Alert>
            )}

            <TextField
              label="Tenant name"
              placeholder="e.g., Acme Corp"
              value={tenantName}
              onChange={event => setTenantName(event.target.value)}
              fullWidth
              required
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || !tenantName.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create tenant'}
            </Button>
            {/* Forward to new tenant page */}
            {success && (
              <Button
                variant="contained"
                onClick={() => handleForwardToNewTenant(success.host, success.api_key)}
                >
                Go to tenant
              </Button>
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
