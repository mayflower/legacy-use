import { Edit, PlayArrow } from '@mui/icons-material';
import { Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import {
  type ActionStep,
  type AnalyzeVideoAiAnalyzePostResult,
  executeWorkflowInteractiveSessionsSessionIdWorkflowPost,
  type Parameter,
  type Session,
} from '../gen/endpoints';

interface ActionStepCardProps {
  action: ActionStep;
  onUpdate: (updatedAction: ActionStep) => void;
}

function ActionStepCard({ action, onUpdate }: ActionStepCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAction, setEditedAction] = useState(action);

  const handleSave = () => {
    onUpdate(editedAction);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedAction(action);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Card sx={{ mb: 3, position: 'relative' }}>
      <CardContent>
        {isEditing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              value={editedAction.title}
              onChange={e => setEditedAction({ ...editedAction, title: e.target.value })}
              onKeyDown={handleKeyPress}
              fullWidth
              size="small"
            />
            <TextField
              label="Instruction"
              value={editedAction.instruction}
              onChange={e => setEditedAction({ ...editedAction, instruction: e.target.value })}
              onKeyDown={handleKeyPress}
              fullWidth
              multiline
              rows={3}
              size="small"
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained" onClick={handleSave}>
                Save
              </Button>
              <Button size="small" variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">{action.title}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography fontSize={12} fontFamily="monospace" color="text.secondary">
                  {action.tool}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {action.instruction}
            </Typography>
          </>
        )}
      </CardContent>
      {!isEditing && (
        <Box
          onClick={() => setIsEditing(true)}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              '& .edit-icon': {
                opacity: 1,
              },
            },
          }}
        >
          <Edit
            className="edit-icon"
            sx={{
              color: 'white',
              fontSize: 32,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />
        </Box>
      )}
    </Card>
  );
}

interface ParameterCardProps {
  parameter: Parameter;
  onUpdate: (updatedParameter: Parameter) => void;
}

function ParameterCard({ parameter, onUpdate }: ParameterCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedParameter, setEditedParameter] = useState(parameter);

  const handleSave = () => {
    onUpdate(editedParameter);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedParameter(parameter);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Card sx={{ mb: 3, position: 'relative' }}>
      <CardContent>
        {isEditing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={editedParameter.name}
              onChange={e => setEditedParameter({ ...editedParameter, name: e.target.value })}
              onKeyDown={handleKeyPress}
              fullWidth
              size="small"
            />
            <TextField
              label="Type"
              value={editedParameter.type}
              onChange={e => setEditedParameter({ ...editedParameter, type: e.target.value })}
              onKeyDown={handleKeyPress}
              fullWidth
              size="small"
            />
            <TextField
              label="Description"
              value={editedParameter.description}
              onChange={e =>
                setEditedParameter({ ...editedParameter, description: e.target.value })
              }
              onKeyDown={handleKeyPress}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained" onClick={handleSave}>
                Save
              </Button>
              <Button size="small" variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1">{parameter.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {JSON.stringify(parameter.default)}
                </Typography>
              </Box>
              <Typography fontSize={12} fontFamily="monospace" color="text.secondary">
                {parameter.type}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {parameter.description}
            </Typography>
          </>
        )}
      </CardContent>
      {!isEditing && (
        <Box
          onClick={() => setIsEditing(true)}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              '& .edit-icon': {
                opacity: 1,
              },
            },
          }}
        >
          <Edit
            className="edit-icon"
            sx={{
              color: 'white',
              fontSize: 32,
              opacity: 0,
              transition: 'opacity 0.2s',
            }}
          />
        </Box>
      )}
    </Card>
  );
}

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
    try {
      const response = await executeWorkflowInteractiveSessionsSessionIdWorkflowPost(
        currentSession.id,
        {
          steps: actions,
          parameters: parameters,
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
