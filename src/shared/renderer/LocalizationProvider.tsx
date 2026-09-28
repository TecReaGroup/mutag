import { createContext, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { createTranslator } from "../localization";
import type { Language, Translate } from "../localization";

const LocalizationContext = createContext<{ language: Language; t: Translate } | null>(null);

/** Distribute the persisted language without creating a second language state. */
export function LocalizationProvider({ language, children }: { language: Language; children: ReactNode }) {
  const value = useMemo(() => ({ language, t: createTranslator(language) }), [language]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

/** Read the application language and its type-safe translator. */
export function useTranslation() {
  const localization = useContext(LocalizationContext);
  if (!localization) throw new Error("useTranslation requires LocalizationProvider");
  return localization;
}
