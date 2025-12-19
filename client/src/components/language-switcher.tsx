import { Globe } from "lucide-react";
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
          className={language === "en" ? "bg-accent" : ""}
          data-testid="button-lang-en"
        >
          <span className="mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("de")}
          className={language === "de" ? "bg-accent" : ""}
          data-testid="button-lang-de"
        >
          <span className="mr-2">🇩🇪</span>
          Deutsch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
