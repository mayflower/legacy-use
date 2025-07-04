import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Card, CardContent, Chip, Divider, IconButton, Typography } from '@mui/material';
import { useState } from 'react';

// Add browser globals
const { URL } = globalThis;

// Custom component for displaying HTTP exchanges
const HttpExchangeViewer = ({ exchanges }) => {
  if (!exchanges || exchanges.length === 0) {
    return <Typography variant="body2">No HTTP exchanges available</Typography>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      {exchanges.map(exchange => (
        <HttpExchangeItem key={exchange.id} exchange={exchange} />
      ))}
    </Box>
  );
};

// Component for a single HTTP exchange item
const HttpExchangeItem = ({ exchange }) => {
  const [expanded, setExpanded] = useState(false);

  // Handle different possible structures
  let exchangeData = exchange;

  // If the exchange has a content property, use that
  if (exchange.content && typeof exchange.content === 'object') {
    exchangeData = exchange.content;
  }

  // Extract request and response based on the structure
  const request = exchangeData.request || {};
  const response = exchangeData.response || {};

  // Extract data with fallbacks
  const url = request.url || exchangeData.url || 'Unknown URL';
  const method = request.method || exchangeData.method || 'Unknown Method';

  // Handle different status code locations
  let status;
  if (response.status_code) status = response.status_code;
  else if (response.status) status = response.status;
  else if (exchangeData.status_code) status = exchangeData.status_code;
  else if (exchangeData.status) status = exchangeData.status;

  const request_headers = request.headers || exchangeData.request_headers || {};
  const response_headers = response.headers || exchangeData.response_headers || {};

  // Handle request body which might be a string or object
  let request_body = request.body || exchangeData.request_body;
  if (typeof request_body === 'string') {
    try {
      // Try to parse JSON string
      const parsedBody = JSON.parse(request_body);
      request_body = parsedBody;
    } catch {
      // Keep as string if not valid JSON
    }
  }

  // Handle response body which might be a string or object
  let response_body = response.body || exchangeData.response_body;
  if (typeof response_body === 'string') {
    try {
      // Try to parse JSON string
      const parsedBody = JSON.parse(response_body);
      response_body = parsedBody;
    } catch {
      // Keep as string if not valid JSON
    }
  }

  const error = exchangeData.error;

  // Safe URL parsing
  let pathname = 'Unknown Path';
  try {
    if (url && typeof url === 'string') {
      pathname = new URL(url).pathname;
    } else {
      pathname = String(url);
    }
  } catch {
    pathname = String(url);
  }

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Card sx={{ mb: 3, border: '1px solid #444' }}>
      <CardContent sx={{ pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1,
            cursor: 'pointer',
          }}
          onClick={handleExpandClick}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              size="small"
              sx={{ mr: 1, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <ExpandMoreIcon />
            </IconButton>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 'bold',
                color: error ? '#ff6b6b' : status >= 400 ? '#ffa94d' : '#4dabf5',
              }}
            >
              {method} {pathname}
            </Typography>
          </Box>
          <Chip
            label={status ? `${status}` : error ? 'Error' : 'Pending'}
            color={error ? 'error' : status >= 400 ? 'warning' : 'success'}
            size="small"
          />
        </Box>

        <Typography variant="caption" color="textSecondary">
          {exchange.timestamp && new Date(exchange.timestamp).toLocaleString()}
        </Typography>

        {expanded && (
          <>
            <Divider sx={{ my: 1 }} />

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Request</Typography>
              {url && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    URL:
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#1a1a1a',
                      p: 1,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      overflowX: 'auto',
                    }}
                  >
                    <pre style={{ margin: 0 }}>{url}</pre>
                  </Box>
                </Box>
              )}

              {Object.keys(request_headers).length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Headers:
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#1a1a1a',
                      p: 1,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      maxHeight: '100px',
                      overflowY: 'auto',
                    }}
                  >
                    <pre style={{ margin: 0 }}>{JSON.stringify(request_headers, null, 2)}</pre>
                  </Box>
                </Box>
              )}

              {request_body && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Body:
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#1a1a1a',
                      p: 1,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    <pre style={{ margin: 0 }}>
                      {typeof request_body === 'object'
                        ? JSON.stringify(request_body, null, 2)
                        : request_body}
                    </pre>
                  </Box>
                </Box>
              )}

              {/* Always show body size if available */}
              {request.body_size !== undefined && !request_body && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Body Size:
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#1a1a1a',
                      p: 1,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                    }}
                  >
                    <pre style={{ margin: 0 }}>{request.body_size} bytes</pre>
                  </Box>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Response</Typography>
              {status && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Status:
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#1a1a1a',
                      p: 1,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                    }}
                  >
                    <pre style={{ margin: 0 }}>{status}</pre>
                  </Box>
                </Box>
              )}

              {Object.keys(response_headers).length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Headers:
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#1a1a1a',
                      p: 1,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      maxHeight: '100px',
                      overflowY: 'auto',
                    }}
                  >
                    <pre style={{ margin: 0 }}>{JSON.stringify(response_headers, null, 2)}</pre>
                  </Box>
                </Box>
              )}

              {response_body && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Body:
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#1a1a1a',
                      p: 1,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    <pre style={{ margin: 0 }}>
                      {typeof response_body === 'object'
                        ? JSON.stringify(response_body, null, 2)
                        : response_body}
                    </pre>
                  </Box>
                </Box>
              )}

              {(() => {
                let tokenUsage = null;
                try {
                  if (response_body && typeof response_body === 'object' && response_body.usage) {
                    tokenUsage = {
                      input: response_body.usage.input_tokens,
                      output: response_body.usage.output_tokens,
                    };
                  }
                } catch (err) {
                  console.error('Error:', err);
                }

                return tokenUsage ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      Token Usage:
                    </Typography>
                    <Box
                      sx={{
                        backgroundColor: '#1a1a1a',
                        p: 1,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                      }}
                    >
                      <pre style={{ margin: 0 }}>
                        {`Input: ${tokenUsage.input.toLocaleString()} tokens\nOutput: ${tokenUsage.output.toLocaleString()} tokens`}
                      </pre>
                    </Box>
                  </Box>
                ) : null;
              })()}

              {/* Always show body size if available */}
              {response.body_size !== undefined && !response_body && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Body Size:
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#1a1a1a',
                      p: 1,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                    }}
                  >
                    <pre style={{ margin: 0 }}>{response.body_size} bytes</pre>
                  </Box>
                </Box>
              )}
            </Box>

            {error && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="error">
                  Error
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#1a1a1a',
                    p: 1,
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: '#ff6b6b',
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    {typeof error === 'object' ? JSON.stringify(error, null, 2) : error}
                  </pre>
                </Box>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HttpExchangeViewer;
