import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X, Instagram, User, Upload, LogOut, LogIn, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { UserSearch } from "./user-search";
import { NotificationsDropdown } from "./notifications-dropdown";
import { useAuth } from "@/hooks/use-auth";
import logoImage from "@assets/IMG_0856_1766103768140.gif";

const navLinks = [
  { name: "About", href: "#about" },
  { name: "Memes", href: "#memes" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Contests", href: "/contests" },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();

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
            className="flex items-center gap-3"
            data-testid="link-logo"
          >
            <img
              src={logoImage}
              alt="MemeVerse Logo"
              className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover"
            />
            <span className="font-bold text-xl md:text-2xl">MemeVerse</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              link.href.startsWith("/") ? (
                <Link key={link.name} href={link.href}>
                  <Button variant="ghost" data-testid={`link-nav-${link.name.toLowerCase()}`}>
                    {link.name}
                  </Button>
                </Link>
              ) : (
                <Button
                  key={link.name}
                  variant="ghost"
                  onClick={() => scrollToSection(link.href)}
                  data-testid={`link-nav-${link.name.toLowerCase()}`}
                >
                  {link.name}
                </Button>
              )
            ))}
            {user && (
              <Link href="/upload">
                <Button variant="ghost" data-testid="link-nav-upload">
                  Upload
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
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/upload" className="flex items-center gap-2 cursor-pointer" data-testid="link-menu-upload">
                      <Upload className="h-4 w-4" />
                      Upload Meme
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center gap-2 cursor-pointer text-destructive"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => window.location.href = "/api/login"}
                className="gap-2"
                data-testid="button-login"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            )}

            <Button
              className="hidden sm:flex gap-2"
              variant="outline"
              onClick={() => window.open("https://instagram.com/MemeVerseDC", "_blank")}
              data-testid="button-follow-instagram"
            >
              <Instagram className="h-4 w-4" />
              <span className="hidden md:inline">Follow</span>
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
              {navLinks.map((link) => (
                link.href.startsWith("/") ? (
                  <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      data-testid={`link-mobile-nav-${link.name.toLowerCase()}`}
                    >
                      {link.name === "Leaderboard" && <Trophy className="h-4 w-4 mr-2" />}
                      {link.name}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    key={link.name}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => scrollToSection(link.href)}
                    data-testid={`link-mobile-nav-${link.name.toLowerCase()}`}
                  >
                    {link.name}
                  </Button>
                )
              ))}
              {user && (
                <>
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <User className="h-4 w-4" />
                      My Profile
                    </Button>
                  </Link>
                  <Link href="/upload" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Meme
                    </Button>
                  </Link>
                </>
              )}
              <Button
                className="mt-2 gap-2"
                onClick={() => window.open("https://instagram.com/MemeVerseDC", "_blank")}
                data-testid="button-mobile-follow-instagram"
              >
                <Instagram className="h-4 w-4" />
                Follow on Instagram
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
