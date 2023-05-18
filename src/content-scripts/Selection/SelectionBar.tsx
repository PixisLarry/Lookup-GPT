import React from 'react'
import * as Selection from './Selection'
import clsx from 'clsx'

type SelectionElement = React.ElementRef<typeof Selection.Trigger>
type SelectionBarProps = {
    gptAnswer: string
    visiable: boolean
}
export const SelectionBar = React.forwardRef<
    SelectionElement,
    SelectionBarProps
>((props: SelectionBarProps, forwardedRef) => {
    return (
        <Selection.Root>
            <Selection.Trigger ref={forwardedRef} asChild></Selection.Trigger>
            <Selection.Content
                sideOffset={8}
                className={
                    clsx(
                        'items-center gap-1 rounded-md bg-white shadow-popover text-base p-2.5 max-w-md',
                        'data-[state=open]:animate-slideDownAndFade data-[state=closed]:animate-slideUpAndFade'
                    ) + `${props.gptAnswer == '' ? ' hidden' : ''} `
                }
            >
                {props.gptAnswer}
                <Selection.Arrow className="fill-white" />
            </Selection.Content>
        </Selection.Root>
    )
})
SelectionBar.displayName = 'SelectionBar'
