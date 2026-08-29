import './globals.css';
export const metadata = { title: 'Never86 + Bolt', description: 'Buy now. We bring it to you.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-never86-ink text-white antialiased">{children}</body>
    </html>
  );
}
