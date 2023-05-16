import LanguageSelector from './LanguageSelector'
import HotKeySelector from './HotKeySelector'

const Setting = () => {
    return (
        <div className="mx-3 w-[300px] h-[400px]">
            <div className="mt-5">
                <LanguageSelector />
            </div>
            <div className="mt-5">
                <HotKeySelector />
            </div>
        </div>
    )
}

export default Setting
