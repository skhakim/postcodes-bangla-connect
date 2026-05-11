import { createFileRoute, Link } from "@tanstack/react-router";
import { Navigation, Search, Map, WifiOff, Code2, ShieldCheck, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BangladeshMap } from "@/components/ipms/BangladeshMap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_public/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "IPMS — Find Your Postcode | Bangladesh Post Office" },
      { name: "description", content: "Find any Bangladesh postcode instantly with GPS, manual search, or our interactive map. An official service of Bangladesh Post Office." },
    ],
  }),
});

function Home() {
  const { t, lang } = useI18n();
  const benefits = [
    { icon: Navigation, title: "GPS Detection", desc: "Detect your postcode using your device's location, accurate to your post office area." },
    { icon: Search, title: "Manual Search", desc: "Search by Division, District, Upazila, or area name in English or Bangla." },
    { icon: Map, title: "Interactive Map", desc: "Explore postcode boundaries and adjacent zones across all 8 divisions." },
    { icon: WifiOff, title: "Offline Friendly", desc: "Cached recent searches keep you productive without an internet connection." },
    { icon: Code2, title: "Public API", desc: "Integrate IPMS into logistics, e-commerce and courier platforms." },
    { icon: ShieldCheck, title: "Government-Grade", desc: "Authoritative postcode source maintained by Bangladesh Post Office." },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-accent/30" />
        <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-2 lg:py-20">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-success" /> Official service · pilot in 8 divisions
            </span>
            <h1 className={cn("mt-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl", lang === "bn" && "font-bangla")}>
              {t("findTitle")}
            </h1>
            <p className={cn("mt-4 max-w-xl text-base text-muted-foreground sm:text-lg", lang === "bn" && "font-bangla")}>
              {t("findSubtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/gps">
                <Button size="lg" className="gap-2 text-base">
                  <Navigation className="h-5 w-5" /> {t("findGps")}
                </Button>
              </Link>
              <Link to="/search">
                <Button size="lg" variant="outline" className="gap-2 text-base">
                  <Search className="h-5 w-5" /> {t("findManual")}
                </Button>
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              <Stat n="500+" l="Postcodes" />
              <Stat n="8" l="Divisions" />
              <Stat n="64" l="Districts" />
            </div>
          </div>
          <div className="relative">
            <div className="rounded-xl border bg-card p-3 shadow-xl">
              <BangladeshMap className="aspect-square w-full" />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-lg border bg-card px-4 py-3 shadow-lg sm:block">
              <div className="text-xs text-muted-foreground">Pilot district</div>
              <div className="text-sm font-semibold">Dhaka — 1205, Dhanmondi</div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">What is IPMS?</h2>
          <p className="mt-3 text-muted-foreground">
            The Integrated Postcode Management System is a national initiative by Bangladesh Post Office to modernize how citizens, postal staff, and partner businesses look up and manage postcodes — replacing fragmented lists with a single, authoritative, GIS-backed source.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y bg-secondary/30">
        <div className="container mx-auto px-4 py-14">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">{t("benefits")}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <Card key={b.title} className="border-border/60">
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 font-semibold">{b.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="container mx-auto px-4 py-14">
        <div className="rounded-2xl border bg-primary p-8 text-primary-foreground sm:p-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-2xl font-bold">Building a logistics or e-commerce product?</h3>
              <p className="mt-2 max-w-xl text-primary-foreground/80">
                Use the official IPMS API for postcode lookup, reverse geocoding, and batch validation.
              </p>
            </div>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="gap-2">
                API Documentation <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-primary">{n}</div>
      <div className="text-xs text-muted-foreground">{l}</div>
    </div>
  );
}
