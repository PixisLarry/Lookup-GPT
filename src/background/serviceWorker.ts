import { askChatGPT } from './openai'

const lastRequest = {
    tabId: 0,
    message: {} as AskChatGptMessage,
    requestTime: Date.now(),
}

chrome.runtime.onMessage.addListener(async (msg: MessageType) => {
    // nothing to do
})

chrome.runtime.onConnect.addListener(async (port) => {
    // check is tab id exist
    if (port.sender?.tab?.id === undefined) return

    console.debug('tab : ' + port.sender.tab.id + ' connected...')

    port.onMessage.addListener(async (msg: AskChatGptMessage) => {
        if (
            // check request time is less than 3 seconds
            Date.now() - lastRequest.requestTime < 3000 &&
            // check request is same
            lastRequest.tabId === port.sender?.tab?.id &&
            lastRequest.message === msg
        ) {
            console.debug('same request, return...')
            return
        }

        lastRequest.message = msg
        lastRequest.tabId = port.sender?.tab?.id || 0

        await askChatGPT(
            {
                context: msg.context,
                target: msg.target,
                uuids: msg.uuids,
            },
            (answer) => {
                port.postMessage(answer)
            }
        )
    })
})
