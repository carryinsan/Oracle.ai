```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORACLE | Enterprise Intelligence",
  description: "Advanced multi-model cognitive operating system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-cyan-500/30">
        {children}
      </body>
    </html>
  );
}

```
