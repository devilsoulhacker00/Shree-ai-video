import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shree AI Video",
  description: "Free browser-first AI video creation studio",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}