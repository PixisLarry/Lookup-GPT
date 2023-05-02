import { askChatGPT } from './openai'

chrome.runtime.onMessage.addListener(async (msg: MessageType) => {
    // nothing to do
})

chrome.runtime.onConnect.addListener(async (port) => {
    // check is tab id exist
    if (port.sender?.tab?.id === undefined) return

    console.debug('tab : ' + port.sender.tab.id + ' connected...')

    port.onMessage.addListener(async (msg: AskChatGptMessage) => {
        await askChatGPT(msg.uuids, msg.context, msg.target, (id, answer) => {
            port.postMessage({
                conversationId: id,
                answer: answer,
            } as AskChatGptResponse)
        })
    })
})
