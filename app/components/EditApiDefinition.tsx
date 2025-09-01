import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useId, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getApiDefinitionDetails,
  getApiDefinitionVersions,
  updateApiDefinition,
  getToolsGroup,
  addCustomActionToApi,
  listCustomActions,
  deleteCustomAction,
} from '../services/apiService';

// Local types for editor state (permissive to keep edits minimal)
interface ApiParamState {
  id?: string;
  name: string;
  description: string;
  type: string;
  required?: boolean;
  default?: any;
}

interface ApiDefState {
  name: string;
  description: string;
  parameters: ApiParamState[];
  prompt: string;
  prompt_cleanup: string;
  response_example: any;
  is_archived: boolean;
}

// Tool specs for UI
type ToolActionSpec = {
  name: string;
  params?: Record<string, any>;
  required?: string[];
};

type ToolSpec = {
  name: string;
  description?: string;
  version?: string;
  actions?: ToolActionSpec[];
  input_schema?: {
    type?: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  options?: Record<string, any>;
};

const EditApiDefinition = () => {
  const { apiName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const versionId = queryParams.get('version') || '';
  const versionSelectLabelId = useId();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiDefinition, setApiDefinition] = useState<ApiDefState>({
    name: '',
    description: '',
    parameters: [],
    prompt: '',
    prompt_cleanup: '',
    response_example: {},
    is_archived: false,
  });

  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [originalApiDefinition, setOriginalApiDefinition] = useState<ApiDefState | null>(null);
  const [isVersionModified, setIsVersionModified] = useState<boolean>(false);

  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('success');

  // Custom Actions state (frontend-only)
  const [availableTools, setAvailableTools] = useState<ToolSpec[]>([]);
  const [toolsLoading, setToolsLoading] = useState<boolean>(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [selectedToolName, setSelectedToolName] = useState<string>('');
  const [selectedActionName, setSelectedActionName] = useState<string>('');
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [customActions, setCustomActions] = useState<
    { name: string; parameters: Record<string, any> }[]
  >([]);
  const [showAdvancedActions, setShowAdvancedActions] = useState<boolean>(false);
  const [customActionName, setCustomActionName] = useState<string>('');
  const [savingCustomAction, setSavingCustomAction] = useState<boolean>(false);
  const [existingCustomActions, setExistingCustomActions] = useState<Record<string, any>>({});
  const [loadingExistingActions, setLoadingExistingActions] = useState<boolean>(false);

  // Load API definition details
  useEffect(() => {
    const fetchApiDefinition = async () => {
      try {
        setLoading(true);
        const data: any = await getApiDefinitionDetails(apiName as string);
        setApiDefinition({
          name: data.name || '',
          description: data.description || '',
          parameters: data.parameters || [],
          prompt: data.prompt || '',
          prompt_cleanup: data.prompt_cleanup || '',
          response_example: data.response_example || {},
          is_archived: data.is_archived || false,
        });
        setOriginalApiDefinition(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching API definition:', err);
        setError(`Failed to load API definition: ${err.message}`);
        setLoading(false);
      }
    };

    fetchApiDefinition();
  }, [apiName]);

  // Load tools for a specific group
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setToolsLoading(true);
        const tools = (await getToolsGroup('computer_use_20250124')) as ToolSpec[];
        // Keep only the computer tools
        const computerOnly = (tools || []).filter(t => t.name === 'computer');
        setAvailableTools(computerOnly);
        if (computerOnly.length > 0) {
          setSelectedToolName(computerOnly[0].name);
        }
        setToolsLoading(false);
      } catch (err: any) {
        console.error('Error fetching tools group:', err);
        setToolsError(`Failed to load tools: ${err?.message || 'Unknown error'}`);
        setToolsLoading(false);
      }
    };
    fetchTools();
  }, []);

  // Load existing custom actions for this API
  useEffect(() => {
    const fetchExisting = async () => {
      if (!apiName) return;
      try {
        setLoadingExistingActions(true);
        const actions = await listCustomActions(apiName as string);
        setExistingCustomActions(actions || {});
      } catch (err: any) {
        console.error('Error fetching existing custom actions:', err);
      } finally {
        setLoadingExistingActions(false);
      }
    };
    fetchExisting();
  }, [apiName, snackbarOpen]);

  // Load API definition versions
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoadingVersions(true);
        const versionsData = await getApiDefinitionVersions(apiName as string);
        setVersions(versionsData as any[]);

        // If a version ID is specified in the URL, select that version
        if (versionId) {
          setSelectedVersionId(versionId);
          const selectedVersion = (versionsData as any[]).find(v => v.id === versionId);
          if (selectedVersion) {
            setApiDefinition((prevState: any) => ({
              ...prevState,
              name: prevState?.name ?? '',
              description: prevState?.description ?? '',
              is_archived: prevState?.is_archived ?? false,
              parameters: selectedVersion.parameters || [],
              prompt: selectedVersion.prompt || '',
              prompt_cleanup: selectedVersion.prompt_cleanup || '',
              response_example: selectedVersion.response_example || {},
            }));
            setOriginalApiDefinition((prevState: any) => ({
              ...(prevState || {
                name: '',
                description: '',
                is_archived: false,
                parameters: [],
                prompt: '',
                prompt_cleanup: '',
                response_example: {},
              }),
              parameters: selectedVersion.parameters,
              prompt: selectedVersion.prompt,
              prompt_cleanup: selectedVersion.prompt_cleanup,
              response_example: selectedVersion.response_example,
            }));
          }
        }

        setLoadingVersions(false);
      } catch (err: any) {
        console.error('Error fetching API definition versions:', err);
        setError(`Failed to load API definition versions: ${err.message}`);
        setLoadingVersions(false);
      }
    };

    fetchVersions();
  }, [apiName, versionId]);

  // Check if the current version has been modified
  useEffect(() => {
    if (originalApiDefinition) {
      const isModified =
        JSON.stringify(apiDefinition.parameters) !==
          JSON.stringify(originalApiDefinition.parameters) ||
        apiDefinition.prompt !== originalApiDefinition.prompt ||
        apiDefinition.prompt_cleanup !== originalApiDefinition.prompt_cleanup ||
        JSON.stringify(apiDefinition.response_example) !==
          JSON.stringify(originalApiDefinition.response_example) ||
        apiDefinition.name !== originalApiDefinition.name ||
        apiDefinition.description !== originalApiDefinition.description;

      setIsVersionModified(isModified);
    }
  }, [apiDefinition, originalApiDefinition]);

  // Handle form field changes
  const handleChange = (field: keyof ApiDefState) => (event: any) => {
    setApiDefinition({
      ...apiDefinition,
      [field]: event.target.value,
    });
  };

  // Handle parameter changes
  const handleParameterChange = (index: number, field: keyof ApiParamState) => (event: any) => {
    const updatedParameters = [...apiDefinition.parameters];
    updatedParameters[index] = {
      ...updatedParameters[index],
      [field]: event.target.value,
    } as ApiParamState;

    setApiDefinition({
      ...apiDefinition,
      parameters: updatedParameters,
    });
  };

  // Add a new parameter
  const handleAddParameter = () => {
    setApiDefinition({
      ...apiDefinition,
      parameters: [
        ...apiDefinition.parameters,
        {
          name: '',
          description: '',
          type: 'string',
          required: false,
          default: '',
        },
      ],
    });
  };

  // Remove a parameter
  const handleRemoveParameter = (index: number) => {
    const updatedParameters = [...apiDefinition.parameters];
    updatedParameters.splice(index, 1);

    setApiDefinition({
      ...apiDefinition,
      parameters: updatedParameters,
    });
  };

  // Handle response example changes
  const handleResponseExampleChange = (event: any) => {
    try {
      const responseExample = JSON.parse(event.target.value);
      setApiDefinition({
        ...apiDefinition,
        response_example: responseExample,
      });
    } catch {
      // If JSON is invalid, just store the string value for now
      setApiDefinition({
        ...apiDefinition,
        response_example: event.target.value,
      });
    }
  };

  // Handle version selection change
  const handleVersionChange = (event: any) => {
    const newVersionId = event.target.value as string;

    // If there are unsaved changes, confirm before switching
    if (isVersionModified) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to switch versions?')) {
        return;
      }
    }

    setSelectedVersionId(newVersionId);

    // Update URL with the selected version
    const newUrl = `/apis/edit/${apiName}?version=${newVersionId}`;
    window.history.pushState({}, '', newUrl);

    // Load the selected version
    if (newVersionId) {
      const selectedVersion = versions.find(v => (v as any).id === newVersionId) as any;
      if (selectedVersion) {
        setApiDefinition(prevState => ({
          name: prevState.name ?? '',
          description: prevState.description ?? '',
          is_archived: prevState.is_archived ?? false,
          parameters: selectedVersion.parameters,
          prompt: selectedVersion.prompt,
          prompt_cleanup: selectedVersion.prompt_cleanup,
          response_example: selectedVersion.response_example,
        }));
        setOriginalApiDefinition(_prevState => ({
          name: apiDefinition.name || '',
          description: apiDefinition.description || '',
          is_archived: apiDefinition.is_archived || false,
          parameters: selectedVersion.parameters || [],
          prompt: selectedVersion.prompt || '',
          prompt_cleanup: selectedVersion.prompt_cleanup || '',
          response_example: selectedVersion.response_example || {},
        }));

        setSnackbarMessage(`Loaded version ${selectedVersion.version_number}`);
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
      }
    } else {
      // If no version is selected, load the current active version
      const activeVersion = versions.find(v => (v as any).is_active) as any;
      if (activeVersion) {
        setApiDefinition(prevState => ({
          ...prevState,
          parameters: activeVersion.parameters,
          prompt: activeVersion.prompt,
          prompt_cleanup: activeVersion.prompt_cleanup,
          response_example: activeVersion.response_example,
        }));
        setOriginalApiDefinition(prevState => ({
          name: prevState?.name ?? apiDefinition.name,
          description: prevState?.description ?? apiDefinition.description,
          is_archived: prevState?.is_archived ?? apiDefinition.is_archived,
          parameters: activeVersion.parameters,
          prompt: activeVersion.prompt,
          prompt_cleanup: activeVersion.prompt_cleanup,
          response_example: activeVersion.response_example,
        }));
      }
    }
  };

  // Save API definition
  const handleSave = async () => {
    try {
      // Validate response_example is valid JSON
      let responseExample = apiDefinition.response_example;
      if (typeof responseExample === 'string') {
        try {
          responseExample = JSON.parse(responseExample);
        } catch {
          setSnackbarMessage('Response example must be valid JSON');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
      }

      // Validate required fields
      if (!apiDefinition.name || !apiDefinition.description || !apiDefinition.prompt) {
        setSnackbarMessage('Name, description, and prompt are required');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // Process parameters before saving
      const processedParameters = apiDefinition.parameters.map(param => {
        if (
          param.type === 'list' &&
          typeof param.default === 'string' &&
          param.default.trim() !== ''
        ) {
          try {
            const parsedDefault = JSON.parse(param.default);
            if (!Array.isArray(parsedDefault)) {
              throw new Error('Default value for list must be a valid JSON array.');
            }
            return { ...param, default: parsedDefault };
          } catch {
            // Throw an error to be caught below, preventing save
            throw new Error(
              `Invalid JSON array in default value for list parameter '${param.name}'.`,
            );
          }
        }
        // Return parameter as is if not type list or default is not a string to parse
        return param;
      });

      // Prepare API definition for update
      const updatedApiDefinition = {
        ...apiDefinition,
        parameters: processedParameters, // Use processed parameters
        response_example: responseExample,
      } as any;

      // Update API definition
      await updateApiDefinition(apiName as string, updatedApiDefinition);

      // Show success message
      setSnackbarMessage('API definition updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Refresh versions
      const versionsData = await getApiDefinitionVersions(apiName as string);
      setVersions(versionsData as any[]);

      // Update original API definition to reflect saved state
      setOriginalApiDefinition({
        ...apiDefinition,
        response_example: responseExample,
      });

      // Reset modified flag
      setIsVersionModified(false);

      // Navigate back to API list after a short delay
      setTimeout(() => {
        navigate('/apis');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving API definition:', err);
      setError(`Failed to save API definition: ${err.message}`);
      setSnackbarMessage(`Failed to update API definition: ${err.message || 'Unknown error'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  // Derived helpers for selected tool/action
  const selectedTool: ToolSpec | undefined = availableTools.find(t => t.name === selectedToolName);
  const selectedAction: ToolActionSpec | undefined = selectedTool?.actions?.find(
    a => a.name === selectedActionName,
  );

  // Partition actions into primary vs advanced
  const primaryActionNames = new Set([
    'left_click',
    'type',
    'key',
    'scroll',
    'double_click',
    'right_click',
    'wait',
  ]);
  const allActions = selectedTool?.actions || [];
  const primaryActions = allActions.filter(a => primaryActionNames.has(a.name));
  const advancedActions = allActions.filter(a => !primaryActionNames.has(a.name));

  const currentParamSpec: Record<string, any> =
    (selectedAction?.params as Record<string, any>) ||
    (selectedTool?.input_schema?.properties as Record<string, any>) ||
    {};

  const currentRequired: string[] =
    (selectedAction?.required as string[]) ||
    (selectedTool?.input_schema?.required as string[]) ||
    [];

  // Note: tool/action are chosen implicitly (computer fixed; actions via buttons)

  const handleParamChange = (key: string) => (event: any) => {
    setParamValues(prev => ({ ...prev, [key]: event.target.value }));
  };

  const handleCoordinateChange = (axis: 0 | 1) => (event: any) => {
    const raw = event.target.value;
    const num = raw === '' ? '' : Number(raw);
    setParamValues(prev => {
      const prevArr = Array.isArray(prev.coordinate) ? prev.coordinate : [ '', '' ];
      const nextArr: any[] = [...prevArr];
      nextArr[axis] = Number.isNaN(num as any) ? raw : num;
      return { ...prev, coordinate: nextArr };
    });
  };

  const parseParamValue = (schema: any, raw: any) => {
    if (raw === '' || raw === undefined || raw === null) return undefined;
    const type = schema?.type;
    if (type === 'integer' || type === 'number') {
      const n = Number(raw);
      return Number.isNaN(n) ? raw : n;
    }
    if (type === 'array' || type === 'object') {
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      }
      return raw;
    }
    return raw;
  };

  const handleAddConfiguredAction = () => {
    if (!selectedTool) {
      setSnackbarMessage('Please select a tool');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (selectedTool.actions && selectedTool.actions.length > 0 && !selectedAction) {
      setSnackbarMessage('Please select an action');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    for (const key of currentRequired) {
      const val = paramValues[key];
      if (val === undefined || val === '') {
        setSnackbarMessage(`Missing required parameter: ${key}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
    }
    const builtParams: Record<string, any> = {};
    Object.entries(currentParamSpec).forEach(([key, schema]) => {
      const raw = paramValues[key];
      if (raw !== undefined && raw !== '') {
        builtParams[key] = parseParamValue(schema as any, raw);
      }
    });
    if (selectedAction) {
      builtParams.action = selectedAction.name;
    }
    const newAction = { name: selectedTool.name, parameters: builtParams };
    setCustomActions(prev => [...prev, newAction]);
    setParamValues({});
    setSelectedActionName('');
    setSnackbarMessage('Action added');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };

  const handleRemoveConfiguredAction = (index: number) => {
    setCustomActions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveCustomAction = async () => {
    if (!apiName) return;
    if (!customActionName.trim()) {
      setSnackbarMessage('Please provide a name for this custom action');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    if (customActions.length === 0) {
      setSnackbarMessage('Add at least one action to save');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    try {
      setSavingCustomAction(true);
      const payload = {
        name: customActionName.trim(),
        tools: customActions,
      };
      await addCustomActionToApi(apiName as string, payload);
      setSnackbarMessage('Custom action saved');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      // Clear local list and name after save
      setCustomActions([]);
      setCustomActionName('');
    } catch (err: any) {
      setSnackbarMessage(`Failed to save custom action: ${err?.message || 'Unknown error'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSavingCustomAction(false);
    }
  };

  const handleDeleteExistingCustomAction = async (name: string) => {
    if (!apiName) return;
    try {
      await deleteCustomAction(apiName as string, name);
      setSnackbarMessage('Custom action deleted');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setExistingCustomActions(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    } catch (err: any) {
      setSnackbarMessage(`Failed to delete custom action: ${err?.message || 'Unknown error'}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/apis')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Edit API Definition: {apiName}</Typography>
        {apiDefinition.is_archived && (
          <Chip label="Archived" color="error" size="small" sx={{ ml: 2 }} />
        )}
        <Box sx={{ flexGrow: 1 }} />

        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel id={versionSelectLabelId}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <HistoryIcon sx={{ mr: 1 }} />
              Select Version
            </Box>
          </InputLabel>
          <Select
            labelId={versionSelectLabelId}
            value={selectedVersionId}
            onChange={handleVersionChange}
            label="Select Version"
            disabled={loadingVersions || apiDefinition.is_archived}
          >
            {versions.map(version => (
              <MenuItem key={(version as any).id} value={(version as any).id}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                  }}
                >
                  <Typography>Version {(version as any).version_number}</Typography>
                  <Box>
                    {(version as any).is_active && (
                      <Chip label="Active" color="primary" size="small" sx={{ ml: 1 }} />
                    )}
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      {apiDefinition.is_archived && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This API is archived. You cannot edit it. Please unarchive it from the API list page
          first.
        </Alert>
      )}
      {isVersionModified && !apiDefinition.is_archived && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have unsaved changes to this version. Save your changes or select another version to
          discard them.
        </Alert>
      )}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>

        <Grid container spacing={3}>
          <Grid
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <TextField
              label="API Name"
              fullWidth
              value={apiDefinition.name}
              onChange={handleChange('name')}
              margin="normal"
              disabled={true}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              md: 6,
            }}
          >
            <TextField
              label="Description"
              fullWidth
              value={apiDefinition.description}
              onChange={handleChange('description')}
              margin="normal"
              multiline
              rows={2}
              disabled={apiDefinition.is_archived}
            />
          </Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Parameters
        </Typography>

        {apiDefinition.parameters && apiDefinition.parameters.length > 0 ? (
          <Grid container spacing={2}>
            {apiDefinition.parameters.map((param, index) => (
              <Grid key={param.id || index} size={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 4,
                      }}
                    >
                      <TextField
                        label="Parameter Name"
                        value={param.name}
                        onChange={handleParameterChange(index, 'name')}
                        fullWidth
                        margin="normal"
                        disabled={apiDefinition.is_archived}
                      />
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 4,
                      }}
                    >
                      <FormControl fullWidth margin="normal" disabled={apiDefinition.is_archived}>
                        <InputLabel id={`param-type-label-${index}`}>Type</InputLabel>
                        <Select
                          labelId={`param-type-label-${index}`}
                          label="Type"
                          value={param.type || 'string'}
                          onChange={handleParameterChange(index, 'type')}
                        >
                          <MenuItem value="string">String</MenuItem>
                          <MenuItem value="list">List</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 4,
                      }}
                    >
                      <TextField
                        label="Default Value"
                        value={param.default || ''}
                        onChange={handleParameterChange(index, 'default')}
                        fullWidth
                        margin="normal"
                        disabled={apiDefinition.is_archived}
                      />
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        label="Description"
                        value={param.description || ''}
                        onChange={handleParameterChange(index, 'description')}
                        fullWidth
                        margin="normal"
                        multiline
                        rows={2}
                        disabled={apiDefinition.is_archived}
                      />
                    </Grid>
                  </Grid>
                  {!apiDefinition.is_archived && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleRemoveParameter(index)}
                      >
                        Remove
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" color="textSecondary">
            No parameters defined
          </Typography>
        )}

        {!apiDefinition.is_archived && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddParameter}
            sx={{ mt: 2 }}
          >
            Add Parameter
          </Button>
        )}
      </Paper>
      {/* Custom Actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Custom Actions
        </Typography>

        {toolsLoading && (
          <Typography variant="body2" color="textSecondary">Loading tools…</Typography>
        )}
        {toolsError && (
          <Alert severity="error" sx={{ mb: 2 }}>{toolsError}</Alert>
        )}

        <Grid container spacing={2}>
          {/* Actions as selectable buttons (no dropdown) */}
          {selectedTool && selectedTool.actions && selectedTool.actions.length > 0 && (
            <Grid size={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Typography variant="subtitle2">Actions</Typography>
                {advancedActions.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => setShowAdvancedActions(v => !v)}
                    disabled={apiDefinition.is_archived}
                  >
                    {showAdvancedActions ? 'Hide advanced' : 'Show advanced'}
                  </Button>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {primaryActions.map(action => (
                  <Button
                    key={action.name}
                    size="small"
                    variant={selectedActionName === action.name ? 'contained' : 'outlined'}
                    onClick={() => setSelectedActionName(action.name)}
                    disabled={apiDefinition.is_archived}
                  >
                    {action.name}
                  </Button>
                ))}
                {showAdvancedActions &&
                  advancedActions.map(action => (
                    <Button
                      key={action.name}
                      size="small"
                      variant={selectedActionName === action.name ? 'contained' : 'outlined'}
                      onClick={() => setSelectedActionName(action.name)}
                      disabled={apiDefinition.is_archived}
                    >
                      {action.name}
                    </Button>
                  ))}
              </Box>
            </Grid>
          )}

          {/* Dynamic parameter inputs */}
          {Object.keys(currentParamSpec).length > 0 && (
            <Grid size={12}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {Object.entries(currentParamSpec).map(([key, schema]) => {
                    const sch: any = schema as any;
                    const type = sch?.type;
                    const isJson = type === 'array' || type === 'object';
                    const isNumber = type === 'integer' || type === 'number';
                    const required = currentRequired.includes(key);
                    const isCoordinateTuple =
                      key === 'coordinate' && type === 'array' && sch?.minItems === 2 && sch?.maxItems === 2;

                    if (isCoordinateTuple) {
                      const xVal = Array.isArray(paramValues.coordinate)
                        ? (paramValues.coordinate[0] ?? '')
                        : '';
                      const yVal = Array.isArray(paramValues.coordinate)
                        ? (paramValues.coordinate[1] ?? '')
                        : '';
                      return (
                        <Grid key={key} size={{ xs: 12 }}>
                          <Typography variant="subtitle2">{`${key}${required ? ' *' : ''}`}</Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                              label="X"
                              value={xVal}
                              onChange={handleCoordinateChange(0)}
                              fullWidth
                              margin="normal"
                              type="number"
                              disabled={apiDefinition.is_archived}
                            />
                            <TextField
                              label="Y"
                              value={yVal}
                              onChange={handleCoordinateChange(1)}
                              fullWidth
                              margin="normal"
                              type="number"
                              disabled={apiDefinition.is_archived}
                            />
                          </Box>
                        </Grid>
                      );
                    }

                    return (
                      <Grid key={key} size={{ xs: 12, md: 4 }}>
                        <TextField
                          label={`${key}${required ? ' *' : ''}`}
                          value={paramValues[key] ?? ''}
                          onChange={handleParamChange(key)}
                          fullWidth
                          margin="normal"
                          type={isNumber ? 'number' : 'text'}
                          multiline={isJson}
                          rows={isJson ? 3 : 1}
                          helperText={isJson ? 'Enter valid JSON' : (sch?.description || '')}
                          disabled={apiDefinition.is_archived}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </Card>
            </Grid>
          )}

          <Grid size={12}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddConfiguredAction}
              sx={{ mt: 1 }}
              disabled={apiDefinition.is_archived}
            >
              Add Action To List
            </Button>
          </Grid>
        </Grid>

        {/* Current configured actions (frontend only) */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Configured Actions</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Custom action name"
                fullWidth
                value={customActionName}
                onChange={e => setCustomActionName(e.target.value)}
                margin="normal"
                disabled={apiDefinition.is_archived}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={handleSaveCustomAction}
                disabled={apiDefinition.is_archived || savingCustomAction}
              >
                {savingCustomAction ? 'Saving…' : 'Save Custom Action'}
              </Button>
            </Grid>
          </Grid>
          {customActions.length === 0 ? (
            <Typography variant="body2" color="textSecondary">No actions added yet</Typography>
          ) : (
            <Grid container spacing={2}>
              {customActions.map((act, idx) => (
                <Grid key={idx} size={12}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body1">{act.name}</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(act.parameters)}
                        </Typography>
                      </Box>
                      {!apiDefinition.is_archived && (
                        <Button color="error" variant="outlined" onClick={() => handleRemoveConfiguredAction(idx)}>Remove</Button>
                      )}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Existing saved custom actions */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>Saved Custom Actions</Typography>
          {loadingExistingActions ? (
            <Typography variant="body2" color="textSecondary">Loading…</Typography>
          ) : Object.keys(existingCustomActions).length === 0 ? (
            <Typography variant="body2" color="textSecondary">No saved custom actions</Typography>
          ) : (
            <Grid container spacing={2}>
              {Object.entries(existingCustomActions).map(([name, action]) => (
                <Grid key={name} size={12}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body1">{name}</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(action.tools ?? action.actions ?? action)}
                        </Typography>
                      </Box>
                      {!apiDefinition.is_archived && (
                        <Button color="error" variant="outlined" onClick={() => handleDeleteExistingCustomAction(name)}>Delete</Button>
                      )}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Prompt Configuration
        </Typography>

        <TextField
          label="Prompt Template"
          fullWidth
          multiline
          rows={10}
          value={apiDefinition.prompt}
          onChange={handleChange('prompt')}
          margin="normal"
          disabled={apiDefinition.is_archived}
        />

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
          Prompt Cleanup
        </Typography>

        <TextField
          label="Prompt Cleanup"
          fullWidth
          multiline
          rows={4}
          value={apiDefinition.prompt_cleanup}
          onChange={handleChange('prompt_cleanup')}
          margin="normal"
          helperText="JavaScript code to clean up the prompt before sending to the model"
          disabled={apiDefinition.is_archived}
        />
      </Paper>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Response Example
        </Typography>

        <TextField
          label="Response Example (JSON)"
          fullWidth
          multiline
          rows={10}
          value={
            typeof apiDefinition.response_example === 'object'
              ? JSON.stringify(apiDefinition.response_example, null, 2)
              : apiDefinition.response_example
          }
          onChange={handleResponseExampleChange}
          margin="normal"
          error={
            typeof apiDefinition.response_example === 'string' &&
            (apiDefinition.response_example as string).includes('Error')
          }
          helperText={
            typeof apiDefinition.response_example === 'string'
              ? (apiDefinition.response_example as string)
              : 'JSON example of the expected response'
          }
          disabled={apiDefinition.is_archived}
        />
      </Paper>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={() => navigate('/apis')}>
          Cancel
        </Button>
        {!apiDefinition.is_archived && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!isVersionModified}
          >
            Save Changes
          </Button>
        )}
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditApiDefinition;
