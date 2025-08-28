import logging
from typing import Literal

from anthropic.types.beta import BetaToolUnionParam

from .base import BaseAnthropicTool, ToolResult

logger = logging.getLogger('server')


class CustomActionTool(BaseAnthropicTool):
    name: Literal['custom_action'] = 'custom_action'

    def to_params(self) -> BetaToolUnionParam:
        return {
            'name': 'custom_action',
            'description': 'Use this tool when you need to perform a custom action.',
            'input_schema': {
                'type': 'object',
                'properties': {
                    'action_id': {
                        'type': 'string',
                        'description': 'The action id of the custom action',
                    }
                    # api_name and parameters are are handled in the sampling_loop.py and are not required to be passed by the model
                },
                'required': ['action_id'],
            },
        }

    async def __call__(self, action_id: str, api_name: str, **kwargs) -> ToolResult:
        """Process the custom action."""
        try:
            # Log the reasoning
            logger.info(
                f'Custom action tool called with action_id: {action_id} api_name: {api_name}'
            )

            # TODO: handle dynamic parameter input
            # TODO: How to handle sleep times?

            # get all actions by api_name and action_id
            # actions = [
            #     {
            #         'name': 'computer',
            #         'parameters': {
            #             'action': 'left_click',
            #             'coordinate': [100, 100],
            #         },
            #     },
            #     {
            #         'name': 'computer',
            #         'parameters': {'action': 'key', 'text': 'Super_L'},
            #     },
            #     {
            #         'name': 'computer',
            #         'parameters': {'action': 'type', 'text': 'notepad'},
            #     },
            #     {
            #         'name': 'computer',
            #         'parameters': {'action': 'type', 'text': 'helloworld'},
            #     },
            # ]

            # results = []

            # run all actions
            # for action in actions:
            #     # result = await action.__call__()
            #     # results.append(result)
            #     # if result.error -> break and return failed (TODO: best way to handle this?)
            #     pass

            # if all went fine retunr success (and screenshot?)

            return ToolResult(output='Success')
        except Exception as e:
            error_msg = f'Error processing UI not as expected tool: {str(e)}'
            logger.error(error_msg)
            return ToolResult(error=error_msg)
