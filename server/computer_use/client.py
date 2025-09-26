from typing import Iterable

import httpx
from anthropic import APIStatusError, AsyncAnthropic
from anthropic._compat import cached_property
from anthropic._legacy_response import LegacyAPIResponse
from anthropic._models import FinalRequestOptions
from anthropic._types import NotGiven
from anthropic.resources.beta.beta import AsyncBeta, AsyncBetaWithRawResponse
from anthropic.resources.beta.messages.messages import (
    AsyncMessages,
    AsyncMessagesWithRawResponse,
)
from anthropic.types.beta import BetaMessage, BetaMessageParam, BetaTextBlockParam

from server.computer_use.logging import logger
from server.settings import settings


class LegacyAsyncMessagesWithRawResponse(AsyncMessagesWithRawResponse):
    def __init__(self, messages: AsyncMessages) -> None:
        super().__init__(messages)
        self.api_key = getattr(messages._client, 'api_key', None)
        if not self.api_key:
            raise ValueError('LegacyUseClient requires an Anthropic API key')
        if not settings.LEGACYUSE_PROXY_BASE_URL:
            raise ValueError('LEGACYUSE_PROXY_BASE_URL is not set')
        self.base_url = settings.LEGACYUSE_PROXY_BASE_URL

        self.create = self._legacy_use_create

    def with_parse(self, response_json: dict) -> LegacyAPIResponse[BetaMessage]:
        # Create a proper httpx.Response with request information
        request = httpx.Request(
            method='POST',
            url=self.base_url + 'create',
            headers={'Content-Type': 'application/json'},
        )
        raw_response = httpx.Response(
            status_code=200, json=response_json, request=request
        )

        return LegacyAPIResponse(
            raw=raw_response,
            cast_to=BetaMessage,
            client=self._messages._client,
            stream=False,
            stream_cls=None,
            options=FinalRequestOptions(
                method='POST',
                url=self.base_url + 'create',
                headers={'Content-Type': 'application/json'},
                json_data=response_json,
                post_parser=NotGiven(),
            ),
            retries_taken=0,
        )

    async def _legacy_use_create(
        self,
        *,
        max_tokens: int,
        messages: list[BetaMessageParam],
        model: str,
        system: str | Iterable[BetaTextBlockParam],
        tools: list,
        betas: list[str],
        **kwargs,
    ) -> LegacyAPIResponse[BetaMessage]:
        url = self.base_url + 'create'
        headers = {
            'x-api-key': self.api_key,
            'Content-Type': 'application/json',
        }
        data = {
            'max_tokens': max_tokens,
            'messages': messages,
            'model': model,
            'system': system,
            'tools': tools,
            'betas': betas,
            **kwargs,
        }

        logger.info(f'Sending request to {url} with headers: {headers}')

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(url, headers=headers, json=data)
            try:
                response_json = response.json()
                logger.info(f'Response status code: {response.status_code}')
                if response.status_code == 403:
                    raise APIStatusError(
                        message='API Credits Exceeded',
                        response=response,
                        body=response_json,
                    )
                if response.status_code != 200:
                    logger.error(f'Failed to execute API: {response_json}')
                    raise APIStatusError(
                        message=response_json['error'],
                        response=response,
                        body=response_json,
                    )
                # make response parsable via .parse()
                return self.with_parse(response_json)
            except Exception as e:
                logger.error(f'Failed to parse response JSON: {e}')
                raise


class LegacyAsyncMessages(AsyncMessages):
    @cached_property
    def with_raw_response(self) -> LegacyAsyncMessagesWithRawResponse:
        return LegacyAsyncMessagesWithRawResponse(self)


class LegacyAsyncBeta(AsyncBeta):
    @cached_property
    def messages(self) -> LegacyAsyncMessages:
        return LegacyAsyncMessages(self._client)


class LegacyAsyncBetaWithRawResponse(AsyncBetaWithRawResponse):
    @cached_property
    def messages(self) -> LegacyAsyncMessagesWithRawResponse:
        return LegacyAsyncMessagesWithRawResponse(self._beta.messages)


class LegacyUseClient(AsyncAnthropic):
    @cached_property
    def beta(self) -> LegacyAsyncBeta:
        return LegacyAsyncBeta(self)
