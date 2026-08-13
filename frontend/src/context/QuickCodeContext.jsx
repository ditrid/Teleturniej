import { createContext, useContext, useState, useCallback, useMemo } from "react";

const QuickCodeContext = createContext(null);

export function QuickCodeProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openQuickCode = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, openQuickCode, close }),
    [isOpen, openQuickCode, close]
  );

  return (
    <QuickCodeContext.Provider value={value}>
      {children}
    </QuickCodeContext.Provider>
  );
}

export function useQuickCode() {
  const ctx = useContext(QuickCodeContext);
  if (!ctx) {
    throw new Error("useQuickCode must be used within QuickCodeProvider");
  }
  return ctx;
}
