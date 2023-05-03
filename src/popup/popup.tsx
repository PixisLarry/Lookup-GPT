import '../assets/css/popup.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@material-tailwind/react'
import Setting from './Setting'

const App = () => {
    return (
        <React.StrictMode>
            <ThemeProvider>
                <Setting />
            </ThemeProvider>
        </React.StrictMode>
    )
}

const container = document.getElementById('Setting')
if (container) {
    const root = createRoot(container)
    root.render(<App />)
}
