import { campus } from "@/lib/config";
import { ModeToggle } from "@/components/mode-toggle";
import { connection } from "next/server";

export async function AppFooter() {
  await connection(); // The demo label must reflect runtime settings, not build-time defaults.
  const demo = !process.env.SCHEDULE_SOURCE || process.env.SCHEDULE_SOURCE === "demo";
  return (
    <footer className="border-border mt-auto border-t">
      <div className="text-muted-foreground mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5 text-xs">
        <div className="space-y-1">
          <p>{campus.name} · {campus.timeZone}</p>
          <p>{demo ? "Demo: fictional rooms and bookings." : "Availability is based on published bookings."}</p>
          <p>A free slot does not guarantee access or permission to use a room.</p>
        </div>
        <ModeToggle />
      </div>
    </footer>
  );
}
