import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SSATIS",
  description: "실제 불만에서 창업 아이디어를 발견합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
