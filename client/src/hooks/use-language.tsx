import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Language, type TranslationKeys } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("memeverse-language");
      if (saved === "en" || saved === "de") return saved;
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("de")) return "de";
    }
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("memeverse-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
