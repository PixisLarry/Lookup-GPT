declare enum MessageType {
    StopHandle = 'StopHandle',
}

declare interface AskChatGptMessage {
    target: string
    context: string
    uuids: string[]
}

declare interface AskChatGptResponse {
    conversationId: string
    answer: string
}
