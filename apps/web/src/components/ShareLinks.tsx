export function ShareLinks({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { label: "Xでポスト", href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { label: "LINEで送る", href: `https://line.me/R/msg/text/?${encodeURIComponent(`${title}\n${url}`)}` },
    { label: "はてブに追加", href: `https://b.hatena.ne.jp/add?mode=confirm&url=${encodedUrl}&title=${encodedTitle}` },
  ];

  return (
    <div className="share-links">
      <span className="share-links-label">シェア:</span>
      {links.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="share-link">
          {link.label}
        </a>
      ))}
    </div>
  );
}
