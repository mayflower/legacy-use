import logging
from typing import Any, Dict, Literal

from anthropic.types.beta import BetaToolUnionParam

from .base import BaseAnthropicTool, ToolResult

logger = logging.getLogger('server')


class CustomActionTool(BaseAnthropicTool):
    name: Literal['custom_action'] = 'custom_action'
    custom_actions: Dict[str, Any]

    def __init__(self, custom_actions: Dict[str, Any] | None = None):
        super().__init__()
        print(f'Custom actions: {custom_actions}')
        self.custom_actions = custom_actions or {}
        # all custom action names to lowercase # TODO: move this to the database service
        self.custom_actions = {k.lower(): v for k, v in self.custom_actions.items()}

    def _get_action(self, action_name: str) -> Dict[str, Any]:
        return self.custom_actions.get(action_name.lower(), None)

    def to_params(self) -> BetaToolUnionParam:
        return {
            'name': 'custom_action',
            'description': 'Use this tool when you need to perform a custom action.',
            'input_schema': {
                'type': 'object',
                'properties': {
                    'action_name': {
                        'type': 'string',  # make enum based on custom_actions
                        'description': 'The action id of the custom action',
                    }
                    # api_name and parameters are are handled in the sampling_loop.py and are not required to be passed by the model
                },
                'required': ['action_name'],
            },
        }

    async def __call__(self, **kwargs) -> ToolResult:
        """Process the custom action."""
        try:
            action_name = kwargs.get('action_name')
            tool_collection = kwargs.get('tool_collection')

            if not action_name:
                return ToolResult(error='Missing required parameter: action_name')
            if not tool_collection:
                return ToolResult(error='Missing required parameter: tool_collection')

            # Log the reasoning
            logger.info(f'Custom action tool called with action_name: {action_name}')

            # TODO: How to handle sleep times?

            action = self._get_action(action_name)
            print(f'Action: {action}')
            if not action:
                return ToolResult(error=f'Custom action {action_name} not found')

            results = []

            # run all actions
            for tool_action in action['tools']:
                logger.info(f'Running action: {tool_action}')
                result = await tool_collection.run(
                    name=tool_action['name'],
                    tool_input=tool_action['parameters'],
                    session_id=kwargs.get('session_id', None),
                    session=kwargs.get('session', None),
                )
                logger.info('Action result')
                results.append(result)
                if result.error:
                    return ToolResult(error=result.error)

            # if all went fine return success (and screenshot?)
            return ToolResult(output='Success')
        except Exception as e:
            error_msg = f'Error processing custom action tool: {str(e)}'
            logger.error(error_msg)
            return ToolResult(error=error_msg)
