import { useEffect, useState } from "react";
import { pub } from "@/lib/supabase";
import v1 from "@/assets/travel-1.mp4.asset.json";
import v2 from "@/assets/travel-2.mp4.asset.json";
import vK from "@/assets/insta-kyoto.mp4.asset.json";
import t1 from "@/assets/travel-1-thumb.jpg.asset.json";
import t2 from "@/assets/travel-2-thumb.jpg.asset.json";
import tK from "@/assets/insta-kyoto-thumb.jpg.asset.json";
import vB from "@/assets/br-hills.mp4.asset.json";
import tB from "@/assets/br-hills-thumb.jpg.asset.json";
import r1 from "@/assets/real-estate-1.mp4.asset.json";
import rt1 from "@/assets/real-estate-1-thumb.jpg.asset.json";
import r2 from "@/assets/final_3_1.mp4.asset.json";
import rt2 from "@/assets/final_3_1-thumb.jpg.asset.json";
import vx1 from "@/assets/vfx-1.mp4.asset.json";
import vxt1 from "@/assets/vfx-1-thumb.jpg.asset.json";
import e1 from "@/assets/event-recap-willsons.mp4.asset.json";
import et1 from "@/assets/event-recap-willsons-thumb.jpg.asset.json";
import showreel from "@/assets/travel_cinematic.mp4.asset.json";
import profile from "@/assets/profile-2.jpeg.asset.json";

export type Category = { id: string; label: string; tag: string; sort_order: number };

export type ProjectRow = {
  id: string;
  category_id: string;
  title: string;
  description: string;
  video_url: string;
  thumb_url: string;
  sort_order: number;
  is_published: boolean;
};

export type Settings = Record<string, string>;

export type SiteContent = {
  categories: Category[];
  projects: ProjectRow[];
  settings: Settings;
};

/**
 * What the site shows until the database answers (and if it can't be reached).
 * It mirrors the data that was loaded into Supabase, so the page never looks empty.
 */
const fallbackCategories: Category[] = [
  { id: "travel", label: "Travel", tag: "Travel / Vlog", sort_order: 1 },
  { id: "real-estate", label: "Real Estate", tag: "Real Estate", sort_order: 2 },
  { id: "vfx", label: "VFX", tag: "VFX", sort_order: 3 },
  { id: "event-recaps", label: "Event Recaps & Ads", tag: "Event Recap / Ad", sort_order: 4 },
];

const fp = (
  n: number,
  category_id: string,
  title: string,
  description: string,
  video_url: string,
  thumb_url: string,
): ProjectRow => ({
  id: `fallback-${n}`,
  category_id,
  title,
  description,
  video_url,
  thumb_url,
  sort_order: n,
  is_published: true,
});

const fallbackProjects: ProjectRow[] = [
  fp(
    1,
    "travel",
    "Kyoto Cinematic",
    "A cinematic Kyoto travel film — golden streets, temple light and smooth, breathing camera motion.",
    vK.url,
    tK.url,
  ),
  fp(
    2,
    "travel",
    "Golden Hour Escape",
    "A warm, sun-soaked travel cut paced to breathe — handheld frames, soft grade, ambient sound.",
    v1.url,
    t1.url,
  ),
  fp(
    3,
    "travel",
    "Cinematic Roadtrip",
    "Wide landscapes and motion-matched transitions edited into a short cinematic travel story.",
    v2.url,
    t2.url,
  ),
  fp(
    4,
    "travel",
    "BR Hills Ride",
    "A moto-vlog ride through the forest roads of BR Hills, Karnataka — winding climbs, misty valleys and a cinematic summit reveal.",
    vB.url,
    tB.url,
  ),
  fp(
    5,
    "real-estate",
    "Property Showcase",
    "Cinematic real-estate walkthrough with smooth camera movement, warm tones and clean pacing.",
    r1.url,
    rt1.url,
  ),
  fp(
    6,
    "real-estate",
    "Luxury Property Reel",
    "Elegant vertical real-estate film highlighting space, light and atmosphere for premium listings.",
    r2.url,
    rt2.url,
  ),
  fp(
    7,
    "vfx",
    "Holographic Showcase",
    "A 3D VFX composite where a phone projects a spinning holographic carousel of films, with tracked light, depth and motion blur.",
    vx1.url,
    vxt1.url,
  ),
  fp(
    8,
    "event-recaps",
    "Willson's Live Music Lounge — Event Recap",
    "A high-energy event recap for Willson's Restaurant & Live Music Lounge — live band performances, crowd moments and the full night atmosphere cut into a punchy promo film.",
    e1.url,
    et1.url,
  ),
];

export const fallbackSettings: Settings = {
  profile_image_url: profile.url,
  hero_video_url: showreel.url,
  booking_start: "10:00",
  booking_end: "18:00",
  booking_slot_minutes: "60",
  booking_days_off: "0,6",
  booking_max_days_ahead: "60",
};

export const fallbackContent: SiteContent = {
  categories: fallbackCategories,
  projects: fallbackProjects,
  settings: fallbackSettings,
};

/* ─────────────── loading (shared by every component on the page) ─────────────── */

let cache: SiteContent | null = null;
let inflight: Promise<SiteContent | null> | null = null;

async function loadContent(): Promise<SiteContent | null> {
  try {
    const [categories, projects, settingRows] = await Promise.all([
      pub.select<Category>("categories", "select=id,label,tag,sort_order&order=sort_order.asc"),
      pub.select<ProjectRow>(
        "projects",
        "select=id,category_id,title,description,video_url,thumb_url,sort_order,is_published&is_published=eq.true&order=sort_order.asc",
      ),
      pub.select<{ key: string; value: string }>("site_settings", "select=key,value"),
    ]);
    const settings: Settings = { ...fallbackSettings };
    for (const row of settingRows) {
      if (row.value !== "") settings[row.key] = row.value;
    }
    cache = { categories, projects, settings };
    return cache;
  } catch {
    return null; // keep showing the built-in content
  }
}

/** Categories, projects and settings from Supabase (with the built-in content as a safety net). */
export function useSiteContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(cache ?? fallbackContent);

  useEffect(() => {
    let alive = true;
    if (cache) {
      setContent(cache);
      return;
    }
    inflight ??= loadContent().finally(() => {
      inflight = null;
    });
    void inflight.then((c) => {
      if (alive && c) setContent(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  return content;
}
