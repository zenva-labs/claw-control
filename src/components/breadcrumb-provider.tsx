"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

type BreadcrumbContextType = {
  content: ReactNode | null;
  set: (content: ReactNode) => void;
  clear: () => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode | null>(null);
  const clear = useCallback(() => setContent(null), []);
  return (
    <BreadcrumbContext.Provider value={{ content, set: setContent, clear }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function BreadcrumbSlot() {
  const ctx = useContext(BreadcrumbContext);
  return ctx?.content ?? null;
}

export function SetBreadcrumbs({ children }: { children: ReactNode }) {
  const ctx = useContext(BreadcrumbContext);
  useEffect(() => {
    ctx?.set(children);
    return () => ctx?.clear();
  }, [children, ctx]);
  return null;
}
