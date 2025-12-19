import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/use-language";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-language-switcher">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={`gap-2 ${language === "en" ? "bg-primary/10 text-primary" : ""}`}
          data-testid="button-lang-en"
        >
          <span className="font-bold text-xs w-6 h-6 rounded-md bg-muted flex items-center justify-center">EN</span>
          English
          {language === "en" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("de")}
          className={`gap-2 ${language === "de" ? "bg-primary/10 text-primary" : ""}`}
          data-testid="button-lang-de"
        >
          <span className="font-bold text-xs w-6 h-6 rounded-md bg-muted flex items-center justify-center">DE</span>
          Deutsch
          {language === "de" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
