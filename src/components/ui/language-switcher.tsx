import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={className}
      title={language === 'en' ? 'Switch to Thai' : 'Switch to English'}
    >
      <Languages className="h-4 w-4 mr-1" />
      <span>{language === 'en' ? 'TH' : 'EN'}</span>
    </Button>
  );
} 