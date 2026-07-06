import {apiRequest} from './apiClient';

export interface SendConversationMessagePayload {
  message: string;
  conversationId?: string;
  source?: 'text' | 'voice';
}

export interface SendConversationMessageResponse {
  conversationId: string;
  reply: string;
  intent: string;
  messageKind: string;
  cardType: string;
  memoryId: string | null;
  reminderId: string | null;
  aiChatId: string | null;
  pendingActionId: string | null;
  aiRemaining: number | null;
}

interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

type ConversationApiResponse =
  | ApiSuccessResponse<SendConversationMessageResponse>
  | SendConversationMessageResponse;

const isWrappedApiResponse = (
  response: ConversationApiResponse,
): response is ApiSuccessResponse<SendConversationMessageResponse> => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    response.data !== undefined
  );
};

export const sendConversationMessage = async (
  token: string,
  payload: SendConversationMessagePayload,
): Promise<SendConversationMessageResponse> => {
  const response = await apiRequest<ConversationApiResponse>(
    '/conversation/message',
    {
      method: 'POST',
      token,
      body: payload,
    },
  );

  const result = isWrappedApiResponse(response) ? response.data : response;

  if (!result.conversationId) {
    console.log('INVALID CONVERSATION RESPONSE:', response);
    throw new Error('Invalid conversation response from server.');
  }

  return result;
};