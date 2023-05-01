const sessionEndpoint = 'https://chat.openai.com/api/auth/session'
const conversationEndpoint = 'https://chat.openai.com/backend-api/conversation'

// fetch session from opeanai (https://chat.openai.com/api/auth/session)
const fetchSessionFromOpenAI = async () => {
    const response = await fetch(sessionEndpoint)

    if (!response.ok)
        throw new Error(`Fetch session fail! status: ${response.status}`)

    return await response.json()
}

// delete conversation by conversation id
const deleteConversation = async (conversationId: string) => {
    // if conversation id is null, return
    if (!conversationId) return

    // get access token
    const accessToken = (await fetchSessionFromOpenAI()).accessToken

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

export interface ChatGptAnswer {
    conversationId: string
    answer: string
}

const handleEventStreamResponse = async (
    resp: Response,
    callback: (answer: ChatGptAnswer) => void
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
                    if (answer)
                        callback({
                            conversationId: conversationId,
                            answer: answer,
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
    }

    return conversationId
}

interface AskChatGptParams {
    context: string
    target: string
    uuids: Array<string>
}

export const askChatGPT = async (
    { context, target, uuids }: AskChatGptParams,
    callback: (answer: ChatGptAnswer) => void
) => {
    const createChatGptPrompt = (
        target: string,
        context: string,
        lang = 'zh-TW'
    ) => {
        return `
Context:
- ${context}

Explain:
- ${target}

Response lang:
- ${lang}

Restriction:
- Your role is a dictionary or a WIKI.
- Answer in 'lang' value.
- Don't ask any questions.
- If you found the "Explain" value in "Context" has more meaning, (eg. 'hand' in 'Give me a hand'), please explain it.
`
    }

    const createMessage = (prompt: string, uuids: Array<string>) => {
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
            model: 'text-davinci-002-render-sha',
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
                askChatGPT({ context, target, uuids }, callback)
            })
        throw new Error('OpenAI session expired!')
    }

    const message = createMessage(createChatGptPrompt(target, context), uuids)

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
    if (conversation_id) await deleteConversation(conversation_id)
}
