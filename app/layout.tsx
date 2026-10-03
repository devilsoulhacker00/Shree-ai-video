import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shree AI Video",
  description: "Free browser-first AI video creation studio",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<script dangerouslySetInnerHTML={{__html:`if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}))}`}} /></body></html>;
}