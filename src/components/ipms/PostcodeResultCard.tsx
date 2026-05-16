import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { Postcode } from "@/data/postcodes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PostcodeResultCard({ p }: { p: Postcode }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-primary">{p.postcode}</span>
              <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-[10px]">
                {p.status}
              </Badge>
            </div>
            <div className="mt-1 text-base font-semibold">{p.area}</div>
            {p.areaBn && <div className="font-bangla text-sm text-muted-foreground">{p.areaBn}</div>}
            <div className="mt-2 text-xs text-muted-foreground">
              {p.postOffice} · {p.upazila}, {p.district}, {p.division}
            </div>
          </div>
          <Link to="/map" search={{ postcodeId: p.id }} className="shrink-0">
            <Button variant="outline" size="sm" className="gap-1">
              <MapPin className="h-3.5 w-3.5" /> Map
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
