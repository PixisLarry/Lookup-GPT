import { useEffect, useState } from 'react'

import { Card, Button, Select, Option } from '@material-tailwind/react'

import langs from '../utils/i18n-langs.json'

const createLangOptions = () => {
    return Object.entries(langs).map(([k, v]) => (
        <Option key={k} value={k}>
            {v}
        </Option>
    ))
}

export const Setting = () => {
    const [lang, setLang] = useState('')

    useEffect(() => {
        const getLangFromStorage = async () => {
            try {
                const store = await chrome.storage.local.get(['lang'])
                const curr = store.lang as keyof typeof langs
                if (curr) setLang(curr)
            } catch (error) {
                console.error(error)
            }
        }

        getLangFromStorage()
    }, [])

    return (
        <Card className="w-[300px] h-[400px]">
            <p></p>
            <div className="w-32 mt-10 ml-3">
                <Select
                    label="Language"
                    color="blue"
                    value={lang}
                    onChange={(e) => {
                        if (!e) return
                        setLang(e)
                        chrome.storage.local.set({ lang: e })
                    }}
                >
                    {createLangOptions()}
                </Select>
            </div>
        </Card>
    )
}

export default Setting
