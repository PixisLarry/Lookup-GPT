import { askChatGPT, deleteConversation, processConversation } from './openai'

const handleEventStreamResponse = async (
    resp: Response,
    port: chrome.runtime.Port
) => {
    // create a new TextDecoder to decode the response body as UTF-8
    const decoder = new TextDecoder('utf-8')

    // read the response stream incrementally
    let buffer = ''
    let conversationId = null

    // check body is event stream
    if (
        resp.body === null ||
        resp.headers.get('content-type') !== 'text/event-stream'
    ) {
        return null
    }

    const reader = resp.body.getReader()
    while (true) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value)

        // if buffer has EOL, process data
        while (buffer.indexOf('\n\n') !== -1) {
            const data = buffer.slice(0, buffer.indexOf('\n\n'))
            buffer = buffer.slice(buffer.indexOf('\n\n') + 2)
            if (data.startsWith('data: ')) {
                try {
                    const json = JSON.parse(data.slice(6))
                    conversationId = json.conversation_id
                    const result = processConversation(json)
                    if (result)
                        port.postMessage({
                            conversationId: conversationId,
                            result: result,
                        })
                } catch (error) {
                    if (data.includes('[DONE]')) {
                        console.debug('done of conversation : ', conversationId)
                    } else {
                        console.error('parse message fail... ', error)
                    }
                }
            }
        }
        if (done) break
    }

    return conversationId
}

chrome.runtime.onConnect.addListener((port) => {
    // check is tab connected
    if (!port.sender?.tab) return

    console.debug('tab : ' + port.sender.tab.id + 'connected...')
    port.onMessage.addListener(async (msg) => {
        const response = await askChatGPT(msg.context, msg.target, msg.uuids)
        const conversationId = await handleEventStreamResponse(response, port)
        await deleteConversation(conversationId)
    })
})
