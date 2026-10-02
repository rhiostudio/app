import type { Metadata, Viewport } from "next";
import { env } from "cloudflare:workers";
import "./globals.css";
import Studio from "./studio";
import { TokenProvider, type RhioToken } from "@/components/rhio/token-context";
import { chainConfig, rewardConfig } from "@/lib/chain";

// The RHIO contract address shown on the site comes from the server environment (RHIO_TOKEN_ADDRESS), read on every
// request, so adding the token needs no code change. Mainnet only: a test token must never be shown as the contract.
function rhioToken(): { token: RhioToken | null; test: boolean } {
  try {
    const c = chainConfig();
    if (c.network !== "mainnet") return { token: null, test: true };
    return { token: c.rhio ? { address: c.rhio, explorer: `${c.explorer}/token/${c.rhio}`, rewardsLive: rewardConfig(c).live } : null, test: false };
  } catch { return { token: null, test: false }; }
}

// The public origin is only known at runtime (APP_ORIGIN). Without metadataBase the share image was emitted as
// http://localhost:3000/og.png, so link previews on X, Telegram and WhatsApp had no picture.
export function generateMetadata(): Metadata {
  let base = new URL("https://rhio.studio");
  try { base = new URL((env as unknown as { APP_ORIGIN?: string }).APP_ORIGIN || base.href); } catch { /* keep the default */ }
  const description = "AI agents with a face, a wardrobe and real skills.";
  return {
    metadataBase: base,
    title: { default: "RHIO Agent Studio", template: "%s · RHIO" },
    description: "Build an AI agent with a face, a wardrobe and real skills. 25 original 3D characters, an outfit system and skills that do actual work.",
    icons: { icon: "/rhio-icon.svg", shortcut: "/rhio-icon.svg" },
    openGraph: { type: "website", siteName: "RHIO Agent Studio", title: "RHIO Agent Studio", description, images: ["/og.png"] },
    twitter: { card: "summary_large_image", title: "RHIO Agent Studio", description, images: ["/og.png"] },
  };
}
export const viewport: Viewport = { themeColor: "#171816", width: "device-width", initialScale: 1, viewportFit: "cover" };

// Applies the saved theme before first paint (no dark->light flash). Keep in sync with app/theme.ts.
const THEME_BOOT = `try{if(localStorage.getItem("rhio-theme")!=="dark")document.documentElement.dataset.theme="light"}catch(e){document.documentElement.dataset.theme="light"}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" />
      </head>
      <body>
        {/* one app shell for every route: it reads the pathname (lib/routes.ts); pages only mark the routes */}
        <TokenProvider {...rhioToken()}>
          <Studio />
          {children}
        </TokenProvider>
      </body>
    </html>
  );
}
