/* eslint-disable @typescript-eslint/no-empty-interface */
import * as React from 'react'
import ReactDOM from 'react-dom'
import { ComponentPropsWithoutRef, Primitive } from './Primitive'

/* -------------------------------------------------------------------------------------------------
 * Portal
 * -----------------------------------------------------------------------------------------------*/
// type PropsWithoutRef<P> = P extends any ? ('ref' extends keyof P ? Pick<P, Exclude<keyof P, 'ref'>> : P) : P;
// type ComponentPropsWithoutRef<T extends React.ElementType> = PropsWithoutRef<
//   React.ComponentProps<T>
// >;
const PORTAL_NAME = 'Portal'

type PortalElement = React.ElementRef<typeof Primitive.div>
type PrimitiveDivProps = ComponentPropsWithoutRef<typeof Primitive.div>

interface PortalProps extends PrimitiveDivProps {
    container?: HTMLElement | null
}

interface PortalProps {
    container?: HTMLElement | null
}

const Portal = React.forwardRef<PortalElement, PortalProps>(
    (props, forwardedRef) => {
        const { container = globalThis?.document?.body, ...portalProps } = props
        return container
            ? ReactDOM.createPortal(
                  <Primitive.div {...portalProps} ref={forwardedRef} />,
                  container
              )
            : null
    }
)

Portal.displayName = PORTAL_NAME

/* -----------------------------------------------------------------------------------------------*/

const Root = Portal

export {
    Portal,
    //
    Root,
}
export type { PortalProps }
