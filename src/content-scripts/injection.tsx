import '../assets/css/lookupgpt.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@material-tailwind/react'
import LookupGpt from './LookupGpt'

const App = () => {
    return (
        <React.StrictMode>
            <ThemeProvider>
                <LookupGpt />
            </ThemeProvider>
        </React.StrictMode>
    )
}

// Load the extension
window.onload = async () => {
    const container = document.createElement('div')
    container.id = 'lookup-gpt'
    container.className = 'lookup-gpt'
    document.body.append(container)
    const root = createRoot(container)
    root.render(<App />)
}
