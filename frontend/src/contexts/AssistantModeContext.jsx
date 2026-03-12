import { createContext, useContext, useState } from 'react'

const AssistantModeContext = createContext({
  mode: null,    // null | 'popup' | 'inpage' | 'fullpage'
  setMode: () => {},
})

export const AssistantModeProvider = ({ children }) => {
  const [mode, setMode] = useState(null)
  return (
    <AssistantModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AssistantModeContext.Provider>
  )
}

export const useAssistantMode = () => useContext(AssistantModeContext)
