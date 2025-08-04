import axios from 'axios';
import {
  analyzeVideoTeachingModeAnalyzeVideoPost,
  createJobTargetsTargetIdJobsPost,
  getSessionRecordingStatusSessionsSessionIdRecordingStatusGet,
  type ImportApiDefinitionRequest,
  importApiDefinitionApiDefinitionsImportPost,
  type JobCreate,
  listSessionsSessionsGet,
  type RecordingRequest,
  type Session,
  startSessionRecordingSessionsSessionIdRecordingStartPost,
  stopSessionRecordingSessionsSessionIdRecordingStopPost,
} from '../gen/endpoints';
import { forwardDistinctId } from './telemetryService';

// Always use the API_URL from environment variables
// This should be set to the full URL of your API server (e.g., http://localhost:8088)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8088';

// Create an axios instance with default config
export const apiClient = axios.create({
  baseURL: API_URL,
});

// Log every request with telemetry
apiClient.interceptors.request.use(config => {
  forwardDistinctId(config);
  return config;
});

// Function to set the API key for all requests
export const setApiKeyHeader = (apiKey: string | null) => {
  if (apiKey) {
    apiClient.defaults.headers.common['X-API-Key'] = apiKey;
    // Also store in localStorage for the interceptor
    localStorage.setItem('apiKey', apiKey);
  } else {
    delete apiClient.defaults.headers.common['X-API-Key'];
    localStorage.removeItem('apiKey');
  }
};

// Add a request interceptor to ensure API key is set for every request
apiClient.interceptors.request.use(
  config => {
    // Check if API key is in localStorage but not in headers
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey && !config.headers['X-API-Key']) {
      config.headers['X-API-Key'] = apiKey;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Function to test if an API key is valid
export const testApiKey = async (apiKey: string) => {
  // Create a temporary axios instance with the API key
  const tempClient = axios.create({
    baseURL: API_URL,
    headers: {
      'X-API-Key': apiKey,
    },
  });

  // Try to access an endpoint that requires authentication
  const response = await tempClient.get(`${API_URL}/api/definitions`);
  return response.data;
};

// Function to get provider configuration
export const getProviders = async () => {
  const response = await apiClient.get('/settings/providers');
  return response.data;
};

// Function to update provider settings
export const updateProviderSettings = async (provider, credentials) => {
  const response = await apiClient.post('/settings/providers', {
    provider,
    credentials,
  });
  return response.data;
};

// Function to check if any API provider is configured (after ensuring API key is provided)
export const checkApiProviderConfiguration = async () => {
  // Get provider configuration
  const providersData = await getProviders();

  // Check if any provider is configured (has available = true)
  const configuredProviders = providersData.providers.filter(provider => provider.available);
  const hasConfiguredProvider = configuredProviders.length > 0;

  return {
    hasApiKey: true,
    hasConfiguredProvider,
    currentProvider: providersData.current_provider,
    configuredProviders,
    allProviders: providersData.providers,
    error: null,
  };
};

// API Definitions
export const getApiDefinitions = async (include_archived = false) => {
  const response = await apiClient.get('/api/definitions', {
    params: { include_archived },
  });
  return response.data;
};

export const exportApiDefinition = async apiName => {
  const response = await apiClient.get(`/api/definitions/${apiName}/export`);
  return response.data;
};

export const importApiDefinition = async (apiDefinition: ImportApiDefinitionRequest) => {
  return importApiDefinitionApiDefinitionsImportPost(apiDefinition);
};

export const getApiDefinitionDetails = async apiName => {
  // First, get the metadata to check if the API is archived
  const metadataResponse = await apiClient.get(`/api/definitions/${apiName}/metadata`);
  const isArchived = metadataResponse.data.is_archived;

  // For both archived and non-archived APIs, use the export endpoint
  // The backend should handle returning the correct data
  const response = await apiClient.get(`/api/definitions/${apiName}/export`);
  const apiDefinition = response.data.api_definition;

  // Return the API definition with the archived status
  return {
    ...apiDefinition,
    is_archived: isArchived,
  };
};

export const getApiDefinitionVersions = async apiName => {
  const response = await apiClient.get(`/api/definitions/${apiName}/versions`);
  return response.data.versions;
};

export const getApiDefinitionVersion = async (apiName, versionId) => {
  const response = await apiClient.get(`/api/definitions/${apiName}/versions/${versionId}`);
  return response.data.version;
};

export const updateApiDefinition = async (apiName, apiDefinition) => {
  const response = await apiClient.put(`/api/definitions/${apiName}`, {
    api_definition: apiDefinition,
  });
  return response.data;
};

export const archiveApiDefinition = async apiName => {
  const response = await apiClient.delete(`/api/definitions/${apiName}`);
  return response.data;
};

export const unarchiveApiDefinition = async apiName => {
  const response = await apiClient.post(`/api/definitions/${apiName}/unarchive`);
  return response.data;
};

// Sessions
export const getSessions = async (include_archived = false): Promise<Session[]> => {
  return listSessionsSessionsGet({ include_archived });
};

export const getSession = async sessionId => {
  const response = await apiClient.get(`/sessions/${sessionId}`);
  return response.data;
};

export const createSession = async sessionData => {
  const response = await apiClient.post('/sessions/', sessionData);
  return response.data;
};

export const deleteSession = async (sessionId, hardDelete = false) => {
  const endpoint = hardDelete ? `/sessions/${sessionId}/hard` : `/sessions/${sessionId}`;
  const response = await apiClient.delete(endpoint);
  return response.data;
};

// Jobs
export const getJobs = async targetId => {
  const response = await apiClient.get(`/targets/${targetId}/jobs/`);
  return response.data;
};

export const getJobQueueStatus = async () => {
  const response = await apiClient.get('/jobs/queue/status');
  return response.data;
};

export const getAllJobs = async (limit = 10, offset = 0, filters = {}) => {
  const params = {
    limit,
    offset,
    ...filters, // Include any additional filters: status, target_id, api_name
  };

  const response = await apiClient.get('/jobs/', { params });

  // Return the full response - it contains a jobs array and total_count
  return response.data;
};

export const getJob = async (targetId, jobId) => {
  const response = await apiClient.get(`/targets/${targetId}/jobs/${jobId}`);
  // add Z suffix to the date so JS can parse it as UTC
  response.data.created_at = response.data.created_at + 'Z';
  if (response.data.completed_at) {
    response.data.completed_at = response.data.completed_at + 'Z';
  }
  return response.data;
};

export const createJob = async (targetId: string, jobData: JobCreate) => {
  return createJobTargetsTargetIdJobsPost(targetId, jobData);
};

export const interruptJob = async (targetId, jobId) => {
  const response = await apiClient.post(`/targets/${targetId}/jobs/${jobId}/interrupt/`);
  return response.data;
};

export const cancelJob = async (targetId, jobId) => {
  const response = await apiClient.post(`/targets/${targetId}/jobs/${jobId}/cancel/`);
  return response.data;
};

export const getJobLogs = async (targetId, jobId) => {
  const response = await apiClient.get(`/targets/${targetId}/jobs/${jobId}/logs/`);

  // The response is now a direct array of log objects
  const logs = response.data || [];

  // Convert log_type to type for compatibility with LogViewer
  return logs.map(log => ({
    ...log,
    type: log.log_type, // Add type property while preserving log_type
  }));
};

export const getJobHttpExchanges = async (targetId, jobId) => {
  const response = await apiClient.get(`/targets/${targetId}/jobs/${jobId}/http_exchanges/`);

  // Handle the new response format where the endpoint directly returns an array
  // instead of a nested structure with http_exchanges key
  const httpExchanges = Array.isArray(response.data)
    ? response.data
    : response.data.http_exchanges || [];

  return httpExchanges;
};

// Targets
export const getTargets = async (include_archived = false) => {
  const response = await apiClient.get('/targets/', { params: { include_archived } });
  return response.data;
};

export const createTarget = async targetData => {
  const response = await apiClient.post('/targets/', targetData);
  return response.data;
};

export const getTarget = async targetId => {
  const response = await apiClient.get(`/targets/${targetId}`);
  return response.data;
};

export const updateTarget = async (targetId, targetData) => {
  const response = await apiClient.put(`/targets/${targetId}`, targetData);
  return response.data;
};

export const deleteTarget = async (targetId, hardDelete = false) => {
  const endpoint = hardDelete ? `/targets/${targetId}/hard` : `/targets/${targetId}`;
  const response = await apiClient.delete(endpoint);
  return response.data;
};

// Resolve a job (set to success with custom result)
export const resolveJob = async (targetId, jobId, result) => {
  const response = await apiClient.post(`/targets/${targetId}/jobs/${jobId}/resolve/`, result);
  return response.data;
};

// Health check
export const checkTargetHealth = async containerIp => {
  const response = await axios.get(`http://${containerIp}:8088/health`, { timeout: 2000 });
  return response.data;
};

// Resume Job Function (New)
export const resumeJob = async (targetId, jobId) => {
  const response = await apiClient.post(`/targets/${targetId}/jobs/${jobId}/resume/`);
  return response.data;
};

// Recording functions
export const startRecording = async (sessionId: string, options: RecordingRequest) => {
  return startSessionRecordingSessionsSessionIdRecordingStartPost(sessionId, options);
};

export const stopRecording = async (sessionId: string) => {
  return stopSessionRecordingSessionsSessionIdRecordingStopPost(sessionId);
};

// AI Analysis
export const analyzeVideo = async (videoFile: Blob) => {
  return analyzeVideoTeachingModeAnalyzeVideoPost({ video: videoFile });
};

export const getRecordingStatus = async (sessionId: string) => {
  return getSessionRecordingStatusSessionsSessionIdRecordingStatusGet(sessionId);
};
