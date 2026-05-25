import { useEffect, useState } from 'react'

function useDisclosureTransition(isOpen, duration = 180) {
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    let timer

    if (isOpen) {
      timer = window.setTimeout(() => {
        setShouldRender(true)
        setIsClosing(false)
      }, 0)
      return () => window.clearTimeout(timer)
    }

    if (!shouldRender) {
      return undefined
    }

    timer = window.setTimeout(() => {
      setIsClosing(true)
    }, 0)
    const unmountTimer = window.setTimeout(() => {
      setShouldRender(false)
      setIsClosing(false)
    }, duration)

    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(unmountTimer)
    }
  }, [duration, isOpen, shouldRender])

  return { shouldRender, isClosing }
}

export default useDisclosureTransition
