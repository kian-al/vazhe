// منبع واحد توکن‌های طراحی واژه (برگرفته از بازطراحی تأییدشده).
// تم فعال محصول «گرُو» است؛ Orbit و Folio برای مرحله‌های بعد نگه داشته شده‌اند.

export type ThemeId = "grove" | "orbit" | "folio";

export type Theme = {
  id: ThemeId;
  name: string;
  fa: string;
  mode: "light" | "dark";
  vars: Record<string, string>;
};

export const DEFAULT_THEME: ThemeId = "grove";

export const themes: Record<ThemeId, Theme> = {
  grove: {
    id: "grove",
    name: "Grove",
    fa: "گرُو — روشن و تازه",
    mode: "light",
    vars: {
      bg: "#F5F6F2",
      surface: "#FFFFFF",
      surface2: "#EDF1E9",
      ink: "#23382D",
      ink2: "#536357",
      line: "#D9E0D5",
      edge: "#778675",
      accent: "#245D43",
      "accent-ink": "#FFFFFF",
      "accent-soft": "#E5EDDD",
      warm: "#A8421C",
      "warm-soft": "#FBE6DA",
      ok: "#136A40",
      danger: "#B3261E",
      "danger-soft": "#FBE0DE",
      hl: "#C5E8D1",
    },
  },
  orbit: {
    id: "orbit",
    name: "Orbit",
    fa: "اوربیت — تیره",
    mode: "dark",
    vars: {
      bg: "#0E1120",
      surface: "#171B30",
      surface2: "#212644",
      ink: "#EDEFFA",
      ink2: "#A6AECF",
      line: "#2D3459",
      edge: "#7C86B3",
      accent: "#7FD3A8",
      "accent-ink": "#0E1120",
      "accent-soft": "#1E3A3A",
      warm: "#F2A57E",
      "warm-soft": "#3A2A2A",
      ok: "#7FD3A8",
      danger: "#FF9B91",
      "danger-soft": "#3D2026",
      hl: "#2A4A45",
    },
  },
  folio: {
    id: "folio",
    name: "Folio",
    fa: "فولیو — کاغذ گرم",
    mode: "light",
    vars: {
      bg: "#F4EEE0",
      surface: "#FCF9F2",
      surface2: "#EDE5D3",
      ink: "#2B2620",
      ink2: "#5B5245",
      line: "#D8CDB6",
      edge: "#857A66",
      accent: "#2D6A4F",
      "accent-ink": "#FFFFFF",
      "accent-soft": "#DCEBDD",
      warm: "#A8421C",
      "warm-soft": "#F6DFD2",
      ok: "#256040",
      danger: "#A3282B",
      "danger-soft": "#F7DADA",
      hl: "#CFE6D3",
    },
  },
};

export const themeList = Object.values(themes);

export function themeCss(): string {
  return themeList
    .map(
      (t) =>
        `[data-theme="${t.id}"]{color-scheme:${t.mode};${Object.entries(t.vars)
          .map(([k, v]) => `--${k}:${v};`)
          .join("")}}`,
    )
    .join("\n");
}

function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** جفت‌رنگ‌هایی که در رابط واقعاً کنار هم می‌آیند + حداقل لازم WCAG AA */
export const contrastPairs: { label: string; fg: string; bg: string; min: number }[] = [
  { label: "ink/bg", fg: "ink", bg: "bg", min: 4.5 },
  { label: "ink/surface", fg: "ink", bg: "surface", min: 4.5 },
  { label: "ink2/bg", fg: "ink2", bg: "bg", min: 4.5 },
  { label: "ink2/surface", fg: "ink2", bg: "surface", min: 4.5 },
  { label: "ink2/surface2", fg: "ink2", bg: "surface2", min: 4.5 },
  { label: "accent-ink/accent", fg: "accent-ink", bg: "accent", min: 4.5 },
  { label: "accent/surface", fg: "accent", bg: "surface", min: 4.5 },
  { label: "accent/accent-soft", fg: "accent", bg: "accent-soft", min: 4.5 },
  { label: "warm/surface", fg: "warm", bg: "surface", min: 4.5 },
  { label: "warm/warm-soft", fg: "warm", bg: "warm-soft", min: 4.5 },
  { label: "danger/surface", fg: "danger", bg: "surface", min: 4.5 },
  { label: "ink/hl", fg: "ink", bg: "hl", min: 4.5 },
  { label: "edge/surface (non-text 3:1)", fg: "edge", bg: "surface", min: 3 },
];
