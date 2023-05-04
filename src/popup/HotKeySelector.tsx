import React, { useEffect } from 'react'
import { Card, Input, Button, Typography } from '@material-tailwind/react'

const HotKeySelector = () => {
    const [hotKey, setHotKey] = React.useState('')
    const [isListening, setListening] = React.useState(false)

    useEffect(() => {
        const getHotKeyFromStorage = async () => {
            try {
                const store = await chrome.storage.local.get(['hotKey'])
                const curr = store.hotKey as string
                if (curr) setHotKey(curr)
            } catch (error) {
                console.error(error)
            }
        }

        getHotKeyFromStorage()
    }, [])

    const handleRegister = () => {
        const keyboardListener = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setListening(false)
                setHotKey('')
            } else {
                const keys = []
                // get ctrl/alt/shift/command key
                if (e.ctrlKey) keys.push('Ctrl')
                if (e.altKey) keys.push('Alt')
                if (e.shiftKey) keys.push('Shift')
                if (e.metaKey) keys.push('Command')

                // get key
                if (e.key.length === 1) {
                    if (e.key === ' ') keys.push('Space')
                    keys.push(e.key)
                }

                // set hotkey
                setHotKey(keys.join('+'))
            }
        }

        if (!isListening) {
            setListening(true)
            // regist keydown event
            window.addEventListener('keydown', keyboardListener)
        } else {
            // remove keydown event
            window.removeEventListener('keydown', keyboardListener)
            setListening(false)
            chrome.storage.local.set({ hotKey: hotKey })
        }
    }

    return (
        <Card shadow={false}>
            <Typography variant="h6">Keyboard shortcut :</Typography>
            <div className="relative flex w-full max-w-[240px] mt-1">
                <Input
                    label="keyboard shortcut"
                    value={hotKey}
                    disabled={!isListening}
                    className="pr-20"
                    containerProps={{
                        className: 'min-w-0',
                    }}
                />
                <Button
                    size="sm"
                    color="blue"
                    className="!absolute right-1 top-1 rounded"
                    onClick={handleRegister}
                >
                    {isListening ? 'Register' : 'Change'}
                </Button>
            </div>
        </Card>
    )
}

export default HotKeySelector
