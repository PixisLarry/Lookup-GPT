import { askChatGPT } from './openai'

chrome.runtime.onMessage.addListener(async (msg: MessageType) => {
    // nothing to do
})

chrome.runtime.onConnect.addListener(async (port) => {
    // check is tab id exist
    if (port.sender?.tab?.id === undefined) return

    console.debug('tab : ' + port.sender.tab.id + ' connected...')

    port.onMessage.addListener(async (msg: AskChatGptMessage) => {
        const store = await chrome.storage.local.get(['lang'])
        await askChatGPT(
            msg.uuids,
            msg.context,
            msg.target,
            store.lang,
            (id, answer) => {
                port.postMessage({
                    conversationId: id,
                    answer: answer,
                } as AskChatGptResponse)
            }
        )
    })
})

chrome.runtime.onInstalled.addListener(() => {
    let uiLang = chrome.i18n.getUILanguage()
    uiLang = uiLang.replaceAll('-', '_')
    chrome.storage.local.set({ lang: uiLang })
})
