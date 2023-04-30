declare type AskChatGptMessage = {
    target: string
    context: string
    uuids: string[]
}

declare enum MessageType {
    StopHandle = 'StopHandle',
}
