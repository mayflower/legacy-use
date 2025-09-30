import {
  Cancel as CancelIcon,
  Clear as ClearIcon,
  FilterAlt as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { type ChangeEvent, useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { APIDefinitionWithSchema, Job, Target } from '@/gen/endpoints';
import { cancelJob, getAllJobs, getApiDefinitions, getTargets } from '../services/apiService';
import { getJobStatusChipColor } from '../utils/jobStatus';

const JobsList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const statusFilterId = useId();
  const targetFilterId = useId();
  const apiFilterId = useId();

  // Filter states
  const [filters, setFilters] = useState<{ status: string; target_id: string; api_name: string }>({
    status: '',
    target_id: '',
    api_name: '',
  });
  const [statusOptions] = useState<string[]>([
    'success',
    'error',
    'running',
    'pending',
    'queued',
    'canceled',
  ]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [apis, setApis] = useState<APIDefinitionWithSchema[]>([]);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
  const [cancelingJobId, setCancelingJobId] = useState<string | null>(null);

  // Fetch available targets and APIs for filters
  const fetchFilterOptions = async () => {
    try {
      setLoadingOptions(true);
      const [targetsResponse, apisResponse] = await Promise.all([
        getTargets(true),
        getApiDefinitions(true),
      ]);

      // Process targets response
      // The target response is an array of target objects directly
      setTargets(targetsResponse || []);

      // Process API definitions response
      // The API response contains an array in api_definitions property
      const apisList = Array.isArray(apisResponse) ? apisResponse : [];
      setApis(apisList);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only include non-empty filters
      const activeFilters = Object.entries(filters)
        .filter(([, value]) => value !== '')
        .reduce((acc: Record<string, string>, [key, value]) => {
          acc[key] = value as string;
          return acc;
        }, {});

      const response = await getAllJobs(rowsPerPage, page * rowsPerPage, activeFilters);
      setJobs(response.jobs);
      setTotalCount(response.total_count);
    } catch (err) {
      setError('Failed to fetch jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const handleChangePage = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) =>
    setPage(newPage);

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target as { name: keyof typeof filters; value: string };
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    setPage(0);
    fetchJobs();
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      target_id: '',
      api_name: '',
    });
    setPage(0);
    fetchJobs();
  };

  const handleRowClick = (event, job: Job) => {
    if (event.ctrlKey || event.metaKey) {
      // Open in new tab/window if Ctrl key (or Command key on Mac) is pressed
      window.open(`/jobs/${job.target_id}/${job.id}`, '_blank');
    } else {
      // Normal navigation
      navigate(`/jobs/${job.target_id}/${job.id}`);
    }
  };

  const getStatusColor = (status: string) => getJobStatusChipColor(status);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleCancelJob = async (event, job: Job) => {
    // Prevent row click event
    event.stopPropagation();

    if (cancelingJobId === job.id) return;

    try {
      setCancelingJobId(job.id || null);
      await cancelJob(job.target_id, job.id || '');
      // Refresh the jobs list
      fetchJobs();
    } catch (err) {
      console.error('Error canceling job:', err);
    } finally {
      setCancelingJobId(null);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">All Jobs</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchJobs}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      {/* Filter controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel id={`${statusFilterId}-label`}>Status</InputLabel>
              <Select
                labelId={`${statusFilterId}-label`}
                name="status"
                value={filters.status}
                label="Status"
                onChange={handleFilterChange}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {statusOptions.map(status => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel id={targetFilterId}>Target</InputLabel>
              <Select
                labelId={targetFilterId}
                name="target_id"
                value={filters.target_id}
                label="Target"
                onChange={handleFilterChange}
                disabled={loadingOptions}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {targets.map(target => (
                  <MenuItem key={target.id} value={target.id || ''}>
                    {target.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel id={apiFilterId}>API</InputLabel>
              <Select
                labelId={apiFilterId}
                name="api_name"
                value={filters.api_name}
                label="API"
                onChange={handleFilterChange}
                disabled={loadingOptions}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {apis.map(api => (
                  <MenuItem key={api.name} value={api.name}>
                    {api.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Box display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                startIcon={<FilterIcon />}
                onClick={applyFilters}
                sx={{ mr: 1 }}
              >
                Filter
              </Button>
              <Button variant="outlined" startIcon={<ClearIcon />} onClick={clearFilters}>
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Job ID</TableCell>
              <TableCell>API Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Token Count</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Result/Error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : jobs.length > 0 ? (
              jobs.map(job => (
                <TableRow
                  key={job.id}
                  hover
                  onClick={event => handleRowClick(event, job)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{job.id}</TableCell>
                  <TableCell>{job.api_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={job.status}
                      color={getStatusColor(job.status || '')}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {job.duration_seconds ? `${Math.round(job.duration_seconds)}s` : '-'}
                  </TableCell>
                  <TableCell>
                    {job.total_input_tokens || job.total_output_tokens ? (
                      <Tooltip
                        title={
                          <>
                            <div>
                              <strong>Input:</strong>{' '}
                              {(job.total_input_tokens ?? 0).toLocaleString()}
                            </div>
                            <div>
                              <strong>Output:</strong>{' '}
                              {(job.total_output_tokens ?? 0).toLocaleString()}
                            </div>
                          </>
                        }
                        arrow
                        placement="top"
                      >
                        <span>
                          {(
                            (job.total_input_tokens ?? 0) + (job.total_output_tokens ?? 0)
                          ).toLocaleString()}
                        </span>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{formatDate(job.created_at || '')}</TableCell>
                  <TableCell>{formatDate(job.updated_at || job.created_at || '')}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '250px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {job.error ||
                          (job.result && `${JSON.stringify(job.result).slice(0, 100)}...`)}
                      </Box>
                      {(job.status === 'queued' || job.status === 'pending') && (
                        <Tooltip title="Cancel Job">
                          <IconButton
                            size="small"
                            onClick={event => handleCancelJob(event, job)}
                            disabled={cancelingJobId === job.id}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No jobs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
};

export default JobsList;
