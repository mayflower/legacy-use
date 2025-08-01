import { PlayArrow } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';
import {
  type ActionStep,
  type AnalyzeVideoAiAnalyzePostResult,
  executeWorkflowInteractiveSessionsSessionIdWorkflowPost,
  type Parameter,
  type Session,
  type WorkflowRequestParameters,
} from '../gen/endpoints';
import ActionStepCard from './InteractiveBuilderActionStepCard';
import ParameterCard from './InteractiveBuilderParameterCard';

export default function InteractiveBuilder({
  currentSession,
  analyzeResult,
}: {
  currentSession: Session;
  analyzeResult: AnalyzeVideoAiAnalyzePostResult;
}) {
  const [executeProgress, setExecuteProgress] = useState(false);
  const [actions, setActions] = useState<ActionStep[]>(analyzeResult?.actions ?? []);
  const [parameters, setParameters] = useState<Parameter[]>(analyzeResult?.parameters ?? []);

  const handleInteractiveExecute = async () => {
    setExecuteProgress(true);

    const parametersPayload: WorkflowRequestParameters = parameters.reduce((acc, parameter) => {
      acc[parameter.name] = parameter.default;
      return acc;
    }, {} as WorkflowRequestParameters);

    try {
      const response = await executeWorkflowInteractiveSessionsSessionIdWorkflowPost(
        currentSession.id,
        {
          steps: actions,
          parameters: parametersPayload,
        },
      );
      console.log(response);
    } catch (error) {
      console.error(error);
    } finally {
      setExecuteProgress(false);
    }
  };

  const handleActionUpdate = (index: number, updatedAction: ActionStep) => {
    const newActions = [...actions];
    newActions[index] = updatedAction;
    setActions(newActions);
  };

  const handleParameterUpdate = (index: number, updatedParameter: Parameter) => {
    const newParameters = [...parameters];
    newParameters[index] = updatedParameter;
    setParameters(newParameters);
  };

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h5">Actions</Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<PlayArrow />}
          onClick={handleInteractiveExecute}
          disabled={executeProgress}
        >
          {executeProgress ? 'Executing...' : 'Execute'}
        </Button>
      </Box>

      {actions.map((action, index) => (
        <ActionStepCard
          key={`${action.title}-${index}`}
          action={action}
          onUpdate={updatedAction => handleActionUpdate(index, updatedAction)}
        />
      ))}

      <Typography variant="h5" sx={{ mb: 2 }}>
        Parameters
      </Typography>
      {parameters.map((parameter, index) => (
        <ParameterCard
          key={`${parameter.name}-${index}`}
          parameter={parameter}
          onUpdate={updatedParameter => handleParameterUpdate(index, updatedParameter)}
        />
      ))}
    </Box>
  );
}
