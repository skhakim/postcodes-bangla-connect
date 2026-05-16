import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Camera, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_public/feedback")({
  component: FeedbackPage,
  head: () => ({ meta: [{ title: "Report Postcode Issue — IPMS" }] }),
});

function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);
  const [issue, setIssue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Correction request submitted", { description: "Thank you — our GIS team will review within 5 business days." });
  };

  if (submitted) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-2xl font-bold">Thank you</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Your correction request has been submitted for review. You will receive an SMS once the GIS team has verified the change.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Reference ID: IPMS-{Math.floor(Math.random() * 900000 + 100000)}</p>
            <Button className="mt-6" onClick={() => setSubmitted(false)}>Submit another report</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Report an Issue</h1>
        <p className="mt-1 text-muted-foreground">Help us improve postcode data by reporting incorrect or missing information.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Correction details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Your name <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="name" placeholder="Md. Karim" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="mobile" placeholder="+8801XXXXXXXXX" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" required placeholder="1205" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="area">Area</Label>
              <Input id="area" required placeholder="Dhanmondi" className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label>Issue type</Label>
              <Select value={issue} onValueChange={setIssue}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select issue type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boundary">Boundary mismatch</SelectItem>
                  <SelectItem value="incorrect">Incorrect postcode</SelectItem>
                  <SelectItem value="missing">Missing area</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" required rows={4} placeholder="Describe the issue in detail" className="mt-1.5" />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="button" variant="outline" className="gap-2"><Camera className="h-4 w-4" /> Upload photo</Button>
              <Button type="button" variant="outline" className="gap-2"><MapPin className="h-4 w-4" /> Pin location</Button>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" size="lg">Submit report</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
