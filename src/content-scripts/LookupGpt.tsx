import React, { useEffect, useRef, useState } from 'react'

let port: chrome.runtime.Port | null = null

const LookupGPT = () => {
    const hoverBox = useRef(null)
    const [gptAnswer, setGptAnswer] = useState('')
    const [rect, setRect] = useState(new DOMRect())
    const [visiable, setVisiable] = useState(false)

    useEffect(() => {
        // send message to background.js
        const sendMessageToBackground = (message: AskChatGptMessage) => {
            if (port === null) {
                port = chrome.runtime.connect({ name: 'Lookup-GPT' })
                port.onMessage.addListener((msg) => {
                    setGptAnswer(msg.result)
                })
            }
            port.postMessage(message)
        }

        // listen keyboard event : alt + l
        document.addEventListener('keydown', async (event) => {
            if (event.altKey && event.key === 'l') {
                const selection = document.getSelection()

                // if selection is empty, return
                if (!selection || selection.isCollapsed) return
                // limit request frequency
                const store = await chrome.storage.local.get('lastRequest')

                if (
                    store.lastRequest &&
                    Date.now() - store.lastRequest < 3000
                ) {
                    console.debug('too fast')
                    return
                }

                // set selection rect
                setRect(selection.getRangeAt(0).getBoundingClientRect())
                setGptAnswer('')

                const target = selection.toString()
                let currentNode: any = selection.anchorNode?.parentNode

                // get parentNode if selection is as same as full text
                while (
                    currentNode?.innerText === target &&
                    currentNode.parentNode
                ) {
                    currentNode = currentNode.parentNode
                }

                // use window.crypto create 3 UUIDs
                const uuids = []
                for (let i = 0; i < 3; i++)
                    uuids.push(window.crypto.randomUUID())

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
            className={
                'fixed rounded-md bg-yellow-50 px-2 py-1 border border-black z-max max-w-md'
            }
            style={{ top: rect.bottom, left: rect.left }}
        >
            <p className="text-black">{gptAnswer}</p>
        </div>
    )
}

export default LookupGPT
