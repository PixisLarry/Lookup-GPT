export const createContextMenu = () => {
    chrome.contextMenus.create({
        id: 'lookup-gpt-selection',
        title: '透過 GPT 搜尋 「%s」',
        contexts: ['selection'],
    })
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId == 'lookup-gpt-selection') {
            chrome.tabs.sendMessage(tab?.id ?? 0, {
                action: 'contextMenu-gpt-search-selection',
            })
        }
    })
}
