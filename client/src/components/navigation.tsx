import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Instagram, User, Upload, LogOut, LogIn, Trophy, Globe, Home, Info, ImageIcon, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { UserSearch } from "./user-search";
import { NotificationsDropdown } from "./notifications-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import logoImage from "@assets/IMG_0856_1766103768140.gif";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [location] = useLocation();
  const isHomePage = location === "/";

  const navLinks = [
    { name: t.nav.about, href: "#about", icon: Info },
    { name: t.nav.memes, href: "#memes", icon: ImageIcon },
    { name: t.nav.leaderboard, href: "/leaderboard", icon: Crown },
    { name: t.nav.contests, href: "/contests", icon: Trophy },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const displayName = user?.firstName || "User";
  const avatarUrl = user?.profileImageUrl;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link
            href="/"
            className="flex items-center gap-3 group"
            data-testid="link-logo"
          >
            <div className={`relative ${isHomePage ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""} rounded-full transition-all duration-300 group-hover:ring-2 group-hover:ring-primary group-hover:ring-offset-2 group-hover:ring-offset-background`}>
              <img
                src={logoImage}
                alt="MemeVerse Logo"
                className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl md:text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">MemeVerse</span>
              {isHomePage && <span className="text-[10px] text-muted-foreground -mt-1">@MemeVerseDC</span>}
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return link.href.startsWith("/") ? (
                <Link key={link.name} href={link.href}>
                  <Button variant="ghost" className="gap-2" data-testid={`link-nav-${link.name.toLowerCase()}`}>
                    <IconComponent className="h-4 w-4" />
                    {link.name}
                  </Button>
                </Link>
              ) : (
                <Button
                  key={link.name}
                  variant="ghost"
                  className="gap-2"
                  onClick={() => scrollToSection(link.href)}
                  data-testid={`link-nav-${link.name.toLowerCase()}`}
                >
                  <IconComponent className="h-4 w-4" />
                  {link.name}
                </Button>
              );
            })}
            {user && (
              <Link href="/upload">
                <Button variant="ghost" className="gap-2" data-testid="link-nav-upload">
                  <Upload className="h-4 w-4" />
                  {t.nav.upload}
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <UserSearch />
            </div>
            {user && <NotificationsDropdown />}
            <ThemeToggle />
            
            {isLoading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                      <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer" data-testid="link-menu-profile">
                      <User className="h-4 w-4" />
                      {t.nav.myProfile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/upload" className="flex items-center gap-2 cursor-pointer" data-testid="link-menu-upload">
                      <Upload className="h-4 w-4" />
                      {t.nav.uploadMeme}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t.nav.language}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={() => setLanguage("en")}
                          className={language === "en" ? "bg-accent" : ""}
                          data-testid="button-lang-en"
                        >
                          English
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setLanguage("de")}
                          className={language === "de" ? "bg-accent" : ""}
                          data-testid="button-lang-de"
                        >
                          Deutsch
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center gap-2 cursor-pointer text-destructive"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="button-language-guest">
                      <Globe className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setLanguage("en")}
                      className={language === "en" ? "bg-accent" : ""}
                      data-testid="button-guest-lang-en"
                    >
                      English
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setLanguage("de")}
                      className={language === "de" ? "bg-accent" : ""}
                      data-testid="button-guest-lang-de"
                    >
                      Deutsch
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() => window.location.href = "/api/login"}
                  className="gap-2"
                  data-testid="button-login"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.nav.login}</span>
                </Button>
              </>
            )}

            <Button
              className="hidden sm:flex gap-2"
              variant="outline"
              onClick={() => window.open("https://instagram.com/MemeVerseDC", "_blank")}
              data-testid="button-follow-instagram"
            >
              <Instagram className="h-4 w-4" />
              <span className="hidden md:inline">{t.nav.follow}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border bg-background/95 backdrop-blur-lg">
            <div className="flex flex-col gap-1 pt-4">
              <div className="px-2 pb-2">
                <UserSearch />
              </div>
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return link.href.startsWith("/") ? (
                  <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      data-testid={`link-mobile-nav-${link.name.toLowerCase()}`}
                    >
                      <IconComponent className="h-5 w-5 text-primary" />
                      {link.name}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    key={link.name}
                    variant="ghost"
                    className="justify-start gap-3"
                    onClick={() => scrollToSection(link.href)}
                    data-testid={`link-mobile-nav-${link.name.toLowerCase()}`}
                  >
                    <IconComponent className="h-5 w-5 text-primary" />
                    {link.name}
                  </Button>
                );
              })}
              {user && (
                <div className="border-t border-border mt-2 pt-2">
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <User className="h-5 w-5 text-primary" />
                      {t.nav.myProfile}
                    </Button>
                  </Link>
                  <Link href="/upload" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <Upload className="h-5 w-5 text-primary" />
                      {t.nav.uploadMeme}
                    </Button>
                  </Link>
                </div>
              )}
              <div className="px-2 py-2 border-t border-border mt-2">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  {t.nav.language}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={language === "en" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage("en")}
                    data-testid="button-mobile-lang-en"
                  >
                    English
                  </Button>
                  <Button
                    variant={language === "de" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage("de")}
                    data-testid="button-mobile-lang-de"
                  >
                    Deutsch
                  </Button>
                </div>
              </div>
              <Button
                className="mt-2 gap-2"
                onClick={() => window.open("https://instagram.com/MemeVerseDC", "_blank")}
                data-testid="button-mobile-follow-instagram"
              >
                <Instagram className="h-4 w-4" />
                {t.nav.followOnInstagram}
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
