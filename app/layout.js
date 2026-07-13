import './globals.css';

export const metadata = {
  title: '経歴書管理システム',
  description: '技術者経歴書の作成・編集・出力を行うクライアントサイドアプリケーション',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-800">{children}</body>
    </html>
  );
}
