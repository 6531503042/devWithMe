import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key.toString(),
});

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Try to get stored language or use browser language
  const getBrowserLanguage = (): Language => {
    const navigatorLang = navigator.language.split('-')[0];
    // Currently we only support 'en' and 'th'
    return navigatorLang === 'th' ? 'th' : 'en';
  };

  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('preferred-language');
    return (stored === 'en' || stored === 'th') ? stored : getBrowserLanguage();
  });

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('preferred-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Translation function
  const t = (key: keyof typeof translations.en): string => {
    const translationSet = translations[language];
    return translationSet[key] || translations.en[key] || key.toString();
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 