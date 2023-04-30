import { logConsole } from '../utils/logUtils'

const LookupGPT = () => {
    logConsole('content script loaded')

    chrome.runtime.sendMessage('hello from content script', (response) => {
        console.log(response)
    })
    return (
        <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center">
            <div className="bg-red-700 p-6 rounded-lg">
                <h1 className="text-red-50 text-xl font-bold">Lookup-GPT</h1>
                <p className="bg-red-50 underline">this is some text</p>
            </div>
        </div>
    )
}

export default LookupGPT
