import { Instagram, Twitter, Youtube, Mail, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/IMG_0856_1766103768140.gif";

const socialLinks = [
  { name: "Instagram", icon: Instagram, href: "https://instagram.com/MemeVerseDC" },
  { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com" },
  { name: "Email", icon: Mail, href: "mailto:contact@memeverse.com" },
];

const quickLinks = [
  { name: "About", href: "#about" },
  { name: "Memes", href: "#memes" },
  { name: "Categories", href: "#categories" },
  { name: "Community", href: "#community" },
];

export function Footer() {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={logoImage}
                alt="MemeVerse Logo"
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="font-bold text-xl">MemeVerse</span>
            </div>
            <p className="text-muted-foreground text-sm mb-4 font-serif">
              Your daily dose of internet culture. Follow @MemeVerseDC for the 
              freshest memes and trending content.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((link) => (
                <Button
                  key={link.name}
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (link.href.startsWith("mailto:")) {
                      window.location.href = link.href;
                    } else {
                      window.open(link.href, "_blank");
                    }
                  }}
                  data-testid={`button-social-${link.name.toLowerCase()}`}
                >
                  <link.icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                    data-testid={`link-footer-${link.name.toLowerCase()}`}
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-4">Follow Us</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://instagram.com/MemeVerseDC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2"
                  data-testid="link-footer-instagram"
                >
                  <Instagram className="h-4 w-4" />
                  @MemeVerseDC
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-4">Stay Updated</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Follow us on Instagram for daily memes and updates.
            </p>
            <Button
              className="w-full gap-2"
              onClick={() => window.open("https://instagram.com/MemeVerseDC", "_blank")}
              data-testid="button-footer-follow"
            >
              <Instagram className="h-4 w-4" />
              Follow Now
            </Button>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} MemeVerse. Made with{" "}
            <Heart className="inline h-4 w-4 text-primary" /> for meme lovers.
          </p>
          <p>@MemeVerseDC on Instagram</p>
        </div>
      </div>
    </footer>
  );
}
