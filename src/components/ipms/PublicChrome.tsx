import { Link, useRouterState } from "@tanstack/react-router";
import { Mail, Menu, WifiOff } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useOnline } from "@/lib/online";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex rounded-md border bg-background p-0.5 text-xs">
      <button
        onClick={() => setLang("en")}
        className={cn("px-2 py-1 rounded transition-colors", lang === "en" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
      >
        EN
      </button>
      <button
        onClick={() => setLang("bn")}
        className={cn("px-2 py-1 rounded transition-colors font-bangla", lang === "bn" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
      >
        বাংলা
      </button>
    </div>
  );
}

export function PublicHeader() {
  const { t, lang } = useI18n();
  const { online } = useOnline();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  const links = [
    { to: "/", label: t("home") },
    { to: "/gps", label: t("gps") },
    { to: "/search", label: t("search") },
    { to: "/map", label: t("map") },
    { to: "/feedback", label: t("feedback") },
    { to: "/offline", label: t("offline") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      {/* Gov ribbon */}
      <div className="bg-primary text-primary-foreground text-xs">
        <div className="container mx-auto flex items-center justify-between px-4 py-1.5">
          <span className={cn("truncate", lang === "bn" && "font-bangla")}>{t("govt")}</span>
          <div className="flex items-center gap-3">
            {!online && (
              <span className="inline-flex items-center gap-1 rounded bg-destructive px-2 py-0.5 text-[10px] font-medium">
                <WifiOff className="h-3 w-3" /> Offline
              </span>
            )}
            <a href="mailto:info@bdpost.gov.bd" className="hidden sm:inline-flex items-center gap-1 hover:underline">
              <Mail className="h-3 w-3" /> info@bdpost.gov.bd
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-lg font-bold">ডা</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">{t("bpo")}</div>
            <div className={cn("text-xs text-muted-foreground", lang === "bn" && "font-bangla")}>{t("siteName")}</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                path === l.to && "bg-muted text-primary",
                lang === "bn" && "font-bangla"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link to="/login" className="hidden sm:inline-flex">
            <Button variant="outline" size="sm">{t("adminLogin")}</Button>
          </Link>
          <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t bg-background">
          <div className="container mx-auto flex flex-col px-4 py-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className={cn("py-2 text-sm", path === l.to && "text-primary font-medium", lang === "bn" && "font-bangla")}>
                {l.label}
              </Link>
            ))}
            <Link to="/login" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">{t("adminLogin")}</Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  const { t, lang } = useI18n();
  return (
    <footer className="mt-16 border-t bg-secondary/40">
      <div className="container mx-auto grid gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <div className="font-bold">{t("bpo")}</div>
          <p className={cn("mt-2 text-sm text-muted-foreground", lang === "bn" && "font-bangla")}>{t("siteName")}</p>
        </div>
        <div>
          <div className="text-sm font-semibold">Services</div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li><Link to="/gps" className="hover:text-foreground">GPS Lookup</Link></li>
            <li><Link to="/search" className="hover:text-foreground">Manual Search</Link></li>
            <li><Link to="/map" className="hover:text-foreground">Interactive Map</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold">Support</div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li><Link to="/feedback" className="hover:text-foreground">Report an issue</Link></li>
            <li><Link to="/offline" className="hover:text-foreground">Offline mode</Link></li>
            <li><a href="#" className="hover:text-foreground">Help center</a></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold">Contact</div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Dhaka GPO, Bangladesh</li>
            <li>+880-2-9556021</li>
            <li>info@bdpost.gov.bd</li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Bangladesh Post Office. All rights reserved.</span>
          <span>An initiative of the Ministry of Posts, Telecommunications and Information Technology</span>
        </div>
      </div>
    </footer>
  );
}
