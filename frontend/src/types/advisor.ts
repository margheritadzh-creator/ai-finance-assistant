export interface AdvisorConversation {
    id: number;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface AdvisorConversationPage {
    content: AdvisorConversation[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
}

export interface AdvisorMessage {
    id: number;
    conversationId: number;
    role: string;
    content: string;
    modelName: string | null;
    promptTokens: number | null;
    completionTokens: number | null;
    createdAt: string;
}

export interface AdvisorStreamEvent {
    type: "start" | "delta" | "done" | "error";
    conversationId: number;
    messageId: number | null;
    content: string | null;
}

export interface ConversationCreatePayload {
    title: string | null;
}

export interface FinancialChatPayload {
    message: string;
}