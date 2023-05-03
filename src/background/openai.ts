import { FetchGptModelResponse, FetchSessionResponse } from '../types/openai'

const sessionEndpoint = 'https://chat.openai.com/api/auth/session'
const conversationEndpoint = 'https://chat.openai.com/backend-api/conversation'
const fetchModelEndpoint = 'https://chat.openai.com/backend-api/models'

// fetch session from opeanai (https://chat.openai.com/api/auth/session)
const fetchSessionFromOpenAI = async () => {
    const response = await fetch(sessionEndpoint)

    if (!response.ok)
        throw new Error(`Fetch session fail! status: ${response.status}`)

    return (await response.json()) as FetchSessionResponse
}

// fetch user can use model
const fatchModelsFromOpenAI = async (accessToken: string) => {
    const response = await fetch(fetchModelEndpoint, {
        headers: {
            'content-Type': 'application/json',
            // access token
            authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok)
        throw new Error(`Fetch model fail! status: ${response.status}`)

    const result = (await response.json()) as FetchGptModelResponse
    return result.models
}

// delete conversation by conversation id
const deleteConversation = async (
    accessToken: string,
    conversationId: string
) => {
    console.debug('delete conversation : ', conversationId)
    const url = `${conversationEndpoint}/${conversationId}`
    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'content-Type': 'application/json',
            // access token
            authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            is_visible: 'false',
        }),
    })
    console.debug('delete conversation result : ', await response.json())
}

const processConversation = (conversation: any) => {
    const message = conversation.message

    // if author is not 'assistant', return null
    if (message.author.role !== 'assistant') return null

    // if message is not text, return null
    if (message.content.content_type !== 'text') return null

    // if message is empty, return null
    if (message.content.parts.length === 0) return null

    // get message content
    const content: string = message.content.parts[0]
    return content
}

const handleLoginIn = async (windowId: number, callback: () => void) => {
    const tabs = await chrome.tabs.query({ windowId: windowId })
    if (tabs.length === 0) return
    const targetTab = tabs[0]

    // if tab complete, trying to fetch session
    chrome.tabs.onUpdated.addListener(async function listener(
        tabId,
        changeInfo,
        tab
    ) {
        if (tabId !== targetTab.id) return
        if (changeInfo.status !== 'complete') return

        const session = await fetchSessionFromOpenAI()
        if (!session.accessToken) return
        console.debug('OpenAI login success , close tab and retry ask GPT...')
        chrome.tabs.remove(tabId)
        chrome.tabs.onUpdated.removeListener(listener)
        callback()
    })
}

const handleEventStreamResponse = async (
    resp: Response,
    callback: (id: string, answer: string) => void
): Promise<string | null> => {
    // create a new TextDecoder to decode the response body as UTF-8
    const decoder = new TextDecoder('utf-8')

    // read the response stream incrementally
    let buffer = ''
    let conversationId = null

    // check body is event stream
    if (resp.body === null || !(resp.body instanceof ReadableStream))
        return null

    const reader = resp.body.getReader()
    let hasNext = true
    while (hasNext) {
        const { done, value } = await reader.read()
        hasNext = !done
        buffer += decoder.decode(value)
        // if buffer has EOL, process data
        while (buffer.indexOf('\n\n') !== -1) {
            const data = buffer.slice(0, buffer.indexOf('\n\n'))
            buffer = buffer.slice(buffer.indexOf('\n\n') + 2)
            if (data.startsWith('data: ')) {
                try {
                    const json = JSON.parse(data.slice(6))
                    conversationId = json.conversation_id
                    const answer = processConversation(json)
                    if (answer) callback(conversationId, answer)
                } catch (error) {
                    if (data.includes('[DONE]')) {
                        console.debug('done of conversation : ', conversationId)
                    } else {
                        console.error('parse message fail... ', error)
                    }
                }
            }
        }
    }

    return conversationId
}

export const askChatGPT = async (
    uuids: string[],
    context: string,
    target: string,
    lang: string,
    callback: (id: string, answer: string) => void
) => {
    const createChatGptPrompt = (
        target: string,
        context: string,
        lang = 'en_US'
    ) => {
        return `
Please explain what is
${target}
in
${context}
        
Restriction:
- Your role is a dictionary or a WIKI.
- Answer in '${lang}' language.
- Don't ask any questions.
- If you found the there has more meaning in context, (eg. 'hand' in 'Give me a hand'), please explain it.
- Just output your result.
`
    }

    const createMessage = (
        model: string,
        prompt: string,
        uuids: Array<string>
    ) => {
        return {
            action: 'next',
            messages: [
                {
                    id: uuids[0],
                    author: {
                        role: 'user',
                    },
                    content: {
                        content_type: 'text',
                        parts: [prompt],
                    },
                },
            ],
            parent_message_id: uuids[1],
            model: model,
            // "timezone_offset_min": -480,
            // "variant_purpose": "none",
            // "history_and_training_disabled": false
        }
    }

    // get access token
    const accessToken = (await fetchSessionFromOpenAI()).accessToken

    // if access token is null, return
    if (!accessToken) {
        // open new tab in new window to login
        const tab = await chrome.windows.create({
            url: 'https://chat.openai.com',
            // type: 'popup',
            width: 500,
            height: 500,
        })
        if (tab.id)
            handleLoginIn(tab.id, () => {
                // after login, call askChatGPT again
                askChatGPT(uuids, context, target, lang, callback)
            })
        throw new Error('OpenAI session expired!')
    }

    // check what model can use
    const models = await fatchModelsFromOpenAI(accessToken)
    if (models.length === 0) throw new Error('No model can use!')

    const message = createMessage(
        models[0].slug,
        createChatGptPrompt(target, context, lang),
        uuids
    )

    // send POST request to conversation endpoint
    const response = await fetch(conversationEndpoint, {
        method: 'POST',
        headers: {
            'content-Type': 'application/json',
            // accept event stream
            accept: 'text/event-stream',
            // access token
            authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(message),
    })

    if (!response.ok) throw new Error(`Response status: ${response.status}`)

    // process response
    const conversation_id = await handleEventStreamResponse(response, callback)

    // clear conversation
    if (conversation_id) await deleteConversation(accessToken, conversation_id)
}
