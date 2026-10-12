"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { campus } from "@/lib/config";

export function BuildingSwitcher({
  value,
  onChange,
  triggerClassName,
}: {
  value: string;
  onChange: (code: string) => void;
  triggerClassName: string;
}) {
  return (
    <>
      <label htmlFor="building-switcher" className="sr-only">
        Building
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id="building-switcher"
          aria-label="Building"
          className={triggerClassName}
        >
          <SelectValue placeholder="Select a building" />
        </SelectTrigger>
        <SelectContent className="max-h-72 rounded-lg p-1.5">
          {campus.buildings.map((b) => (
            <SelectItem
              key={b.code}
              value={b.code}
              className="rounded-md py-2.5 pl-3"
            >
              {b.label} ({b.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
