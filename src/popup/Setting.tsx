import { Card } from '@material-tailwind/react'
import LanguageSelector from './LanguageSelector'
import HotKeySelector from './HotKeySelector'

const Setting = () => {
    return (
        <Card className="w-[300px] h-[400px]">
            <div className="mx-3">
                <div className="mt-5">
                    <LanguageSelector />
                </div>
                <div className="mt-5">
                    <HotKeySelector />
                </div>
            </div>
        </Card>
    )
}

export default Setting
