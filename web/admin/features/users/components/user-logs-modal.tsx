"use client";

import { ExternalLink, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useUserLogs } from "../api/get-logs";
import type { AdminUserRow } from "../types";

function formatLocation(
  country: string | null,
  region: string | null,
  city: string | null,
  lat: number | null,
  lng: number | null,
): string {
  const place = [city, region, country].filter(Boolean).join(", ");
  if (place) return place;
  if (lat != null && lng != null) return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  return "—";
}

function mapsLink(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function KindBadge({ kind }: { kind: string }) {
  const isHeartbeat = kind === "HEARTBEAT";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        isHeartbeat
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-brand-gold/20 text-brand-gold"
      }`}
    >
      {isHeartbeat ? "Live" : "Login"}
    </span>
  );
}

/**
 * GPS-precise vs IP-fallback indicator.
 * - BROWSER + accuracy <= 100m: green "Precise"
 * - BROWSER + accuracy > 100m:  amber  "Approx"
 * - IP:                         amber  "Approx" (often wrong by 100+ km in India)
 * - NONE:                       grey   "—"
 */
function SourceBadge({
  source,
  accuracyM,
}: {
  source: string | null;
  accuracyM: number | null;
}) {
  if (!source || source === "NONE") {
    return <span className="text-xs text-brand-fg/40">—</span>;
  }
  const precise = source === "BROWSER" && (accuracyM == null || accuracyM <= 100);
  const label =
    source === "BROWSER"
      ? `GPS${accuracyM != null ? ` ±${accuracyM}m` : ""}`
      : "IP-based · approximate";
  return (
    <span
      title={
        precise
          ? "Coordinates from browser Geolocation API (accurate)."
          : "Approximate location — may be off by tens of kilometres. Likely IP-based or coarse WiFi positioning. Ask the user to grant precise location permission."
      }
      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        precise
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-amber-500/15 text-amber-300"
      }`}
    >
      {label}
    </span>
  );
}

interface Props {
  user: AdminUserRow;
  onClose: () => void;
}

export function UserLogsModal({ user, onClose }: Props) {
  const { data, isLoading, isError, error } = useUserLogs(user.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-brand-bg p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-light">Activity timeline</h2>
            <p className="text-sm text-brand-fg-dim">
              {user.email} · auto-refreshes every 10s · heartbeat every 2 min
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-brand-fg-dim hover:bg-white/5 hover:text-brand-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <p className="py-8 text-center text-sm text-brand-fg/60">Loading…</p>
          )}
          {isError && (
            <p className="py-8 text-center text-sm text-red-400">
              {error instanceof Error ? error.message : "failed to load"}
            </p>
          )}
          {data && data.length === 0 && (
            <p className="py-8 text-center text-sm text-brand-fg/60">
              No login records yet.
            </p>
          )}
          {data && data.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-left text-xs uppercase tracking-wider text-brand-fg-dim">
                  <th className="px-3 py-3 font-medium">When</th>
                  <th className="px-3 py-3 font-medium">Kind</th>
                  <th className="px-3 py-3 font-medium">IP</th>
                  <th className="px-3 py-3 font-medium">Location</th>
                  <th className="px-3 py-3 font-medium">Source</th>
                  <th className="px-3 py-3 font-medium">User-agent</th>
                  <th className="px-3 py-3 font-medium">Map</th>
                </tr>
              </thead>
              <tbody>
                {data.map((log) => {
                  const maps = mapsLink(log.lat, log.lng);
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <KindBadge kind={log.kind} />
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">
                        {log.ip_address ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {formatLocation(log.country, log.region, log.city, log.lat, log.lng)}
                        {log.city && log.lat != null && log.lng != null && (
                          <span className="ml-2 text-brand-fg-dim">
                            ({log.lat.toFixed(2)}, {log.lng.toFixed(2)})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <SourceBadge source={log.geo_source} accuracyM={log.accuracy_m} />
                      </td>
                      <td className="max-w-[280px] truncate px-3 py-3 text-xs text-brand-fg-dim">
                        {log.user_agent ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        {maps ? (
                          <a
                            href={maps}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-gold hover:underline"
                          >
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-brand-fg-dim">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
