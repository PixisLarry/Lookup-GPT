const sessionEndpoint = 'https://chat.openai.com/api/auth/session'
const conversationEndpoint = 'https://chat.openai.com/backend-api/conversation'

// fetch session from opeanai (https://chat.openai.com/api/auth/session)
export const fetchSessionFromOpenAI = async () => {
    const response = await fetch(sessionEndpoint)

    if (!response.ok)
        throw new Error(`Fetch session fail! status: ${response.status}`)

    return await response.json()
}

// delete conversation by conversation id
export const deleteConversation = async (conversationId: string) => {
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

export const processConversation = (conversation: any) => {
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

export const askChatGPT = async (
    context: string,
    target: string,
    uuids: Array<string>
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

    return response
}
