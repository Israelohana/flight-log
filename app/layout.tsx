import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";
import { SourceBanner } from "@/components/source-banner";
import { getFlightData } from "@/lib/data";

export const metadata: Metadata = {
  title: { default: "Flight Log — יומן טיסה", template: "%s · Flight Log" },
  applicationName: "Flight Log",
  appleWebApp: { capable: true, title: "Flight Log", statusBarStyle: "black-translucent" },
  description: "מסע הלמידה שלי בעולם ה-AI · קורס Flying Solo, שדרות",
};

export const viewport: Viewport = { themeColor: "#040812" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { source } = await getFlightData();
  return (
    <html lang="he" dir="rtl">
      <body>
        <Shell source={source}>
          <SourceBanner source={source} />
          {children}
        </Shell>
      </body>
    </html>
  );
}
