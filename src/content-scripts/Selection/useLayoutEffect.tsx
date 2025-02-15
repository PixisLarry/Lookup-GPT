import * as React from 'react'

/**
 * On the server, React emits a warning when calling `useLayoutEffect`.
 * This is because neither `useLayoutEffect` nor `useEffect` run on the server.
 * We use this safe version which suppresses the warning by replacing it with a noop on the server.
 *
 * See: https://reactjs.org/docs/hooks-reference.html#uselayouteffect
 */
// eslint-disable-next-line no-extra-boolean-cast
const useLayoutEffect = Boolean(globalThis?.document)
    ? React.useLayoutEffect
    : // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {}

export { useLayoutEffect }
