# UI customization

The UI uses Tailwind CSS variables in `app/globals.css`, with separate light and dark themes.
Change `--primary`, `--brand`, `--brand-from`, `--brand-to`, `--ring`, and the accent colors
to match your campus. The supplied red palette is generic and includes no university assets.

Room states use green (available), amber (available soon), and red (busy), with text labels and
tinted badges. Keep these readable and distinct from the header color. Building and floor
filters, cards, timelines and the time picker are shared components.

The app name comes from `campus.config.json`. Icons come from lucide-react. Local system fonts
avoid a font download during build or runtime. There are no tracking scripts or externally loaded
images. The `theme` and `room-finder:building` preferences use browser localStorage only.
