import { logConsole } from "../utils/logUtils";

logConsole("background.ts loaded!");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logConsole(`tab ${sender.tab?.id} says: ${message} `);
  sendResponse("background.ts response!");
});
