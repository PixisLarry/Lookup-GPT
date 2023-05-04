import { useEffect, useState } from 'react'

import {
    typography,
    Card,
    Select,
    Option,
    Typography,
} from '@material-tailwind/react'
import langs from '../utils/i18n-langs.json'

const LanguageSelector = () => {
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

    const createLangOptions = () => {
        return Object.entries(langs).map(([k, v]) => (
            <Option key={k} value={k}>
                {v}
            </Option>
        ))
    }

    return (
        <Card shadow={false}>
            <Typography variant="h6">ChatGPT answer language :</Typography>
            <div className="w-32 mt-1">
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

export default LanguageSelector
