import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

let port: chrome.runtime.Port | null = null

const LookupGPT = () => {
    const hoverBox = useRef(null)
    const [gptAnswer, setGptAnswer] = useState('')
    const [rect, setRect] = useState(new DOMRect())
    const [visiable, setVisiable] = useState(false)

    // send message to background.js
    const sendMessageToBackground = (message: AskChatGptMessage) => {
        if (port === null) {
            port = chrome.runtime.connect({ name: 'Lookup-GPT' })
            port.onMessage.addListener((msg: AskChatGptResponse) => {
                setGptAnswer(msg.answer)
            })
        }
        port.postMessage(message)
    }

    const handleAskChatGPT = async () => {
        const selection = document.getSelection()

        // if selection is empty, return
        if (!selection || selection.isCollapsed) return
        // limit request frequency
        const store = await chrome.storage.local.get('lastRequest')

        if (store.lastRequest && Date.now() - store.lastRequest < 3000) {
            console.debug('Ask ChatGPT too fast')
            return
        }

        // set selection rect
        setRect(selection.getRangeAt(0).getBoundingClientRect())
        setGptAnswer('')

        const target = selection.toString()
        let currentNode: any = selection.anchorNode?.parentNode

        // get parentNode if selection is as same as full text
        while (currentNode?.innerText === target && currentNode.parentNode) {
            currentNode = currentNode.parentNode
        }

        // use window.crypto create 3 UUIDs
        const uuids = []
        for (let i = 0; i < 3; i++) uuids.push(window.crypto.randomUUID())

        const message: AskChatGptMessage = {
            target: target,
            context: currentNode.innerText,
            uuids: uuids,
        }

        // register last request time
        await chrome.storage.local.set({ lastRequest: Date.now() })
        setVisiable(true)
        sendMessageToBackground(message)
    }

    useEffect(() => {
        // listen keyboard event : alt + l
        document.addEventListener('keydown', async (event) => {
            // get hotkey from storage
            const store = await chrome.storage.local.get('hotKey')
            const hotKey = store.hotKey as string
            const keys = hotKey.split('+').map((key) => key.toLowerCase())

            if (keys.length === 0) return

            if (keys.includes('ctrl') && !event.ctrlKey) return
            if (keys.includes('alt') && !event.altKey) return
            if (keys.includes('shift') && !event.shiftKey) return
            if (keys.includes('command') && !event.metaKey) return
            if (keys.includes('space') && event.key !== ' ') return
            // check last key is same as event.key
            if (keys[keys.length - 1] !== event.key.toLowerCase()) return

            await handleAskChatGPT()
        })

        // hide hover box when click outside
        document.addEventListener('click', (event) => {
            if (
                hoverBox.current &&
                !(hoverBox.current as HTMLElement).contains(
                    event.target as HTMLElement
                )
            ) {
                // chrome.runtime.sendMessage(MessageType.StopHandle)
                setVisiable(false)
            }
        })
    }, [])

    return !visiable ? null : (
        <div
            ref={hoverBox}
            className="fixed block px-2 py-1 z-max max-w-md
                     bg-white border 
                     border-gray-200 rounded-lg shadow
                       text-left"
            style={{ top: rect.bottom, left: rect.left }}
        >
            <div className="prose">
                <ReactMarkdown>{gptAnswer}</ReactMarkdown>
            </div>
        </div>
    )
}

export default LookupGPT
