import { logConsole } from '../utils/logUtils'

const LookupGPT = () => {
  logConsole('content script loaded');

  chrome.runtime.sendMessage('hello from content script', (response) => {
    console.log(response)
  });
  return (
    <div className="crx-container">
      this is content from chrome extension
    </div>
  )
}

export default LookupGPT