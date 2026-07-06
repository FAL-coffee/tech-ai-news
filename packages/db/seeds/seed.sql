insert into sources (name, kind, url) values
  ('Vercel Blog', 'atom', 'https://vercel.com/atom'),
  ('Next.js Blog', 'rss', 'https://nextjs.org/feed.xml'),
  ('React Blog', 'rss', 'https://react.dev/rss.xml'),
  ('OpenAI News', 'rss', 'https://openai.com/news/rss.xml'),
  ('GitHub Blog', 'rss', 'https://github.blog/feed/'),
  ('GitHub Changelog', 'rss', 'https://github.blog/changelog/feed/'),
  ('AWS News Blog', 'rss', 'https://aws.amazon.com/blogs/aws/feed/'),
  ('Cloudflare Blog', 'rss', 'https://blog.cloudflare.com/rss/'),
  ('Deno Blog', 'atom', 'https://deno.com/feed'),
  ('Bun Blog', 'rss', 'https://bun.com/rss.xml'),
  ('TypeScript Blog', 'rss', 'https://devblogs.microsoft.com/typescript/feed/'),
  ('Next.js Releases', 'github_releases', 'https://github.com/vercel/next.js/releases.atom'),
  ('React Releases', 'github_releases', 'https://github.com/facebook/react/releases.atom'),
  ('Hono Releases', 'github_releases', 'https://github.com/honojs/hono/releases.atom'),
  ('TypeScript Releases', 'github_releases', 'https://github.com/microsoft/TypeScript/releases.atom')
on conflict (url) do nothing;

insert into topics (slug, name_ja, name_en) values
  ('frontend', 'フロントエンド', 'Frontend'),
  ('nextjs', 'Next.js', 'Next.js'),
  ('react', 'React', 'React'),
  ('typescript', 'TypeScript', 'TypeScript'),
  ('javascript', 'JavaScript', 'JavaScript'),
  ('nodejs', 'Node.js / ランタイム', 'Node.js / Runtimes'),
  ('ai-llm', 'AI・LLM', 'AI & LLM'),
  ('dev-tools', '開発ツール', 'Developer Tools'),
  ('cloud', 'クラウド', 'Cloud'),
  ('aws', 'AWS', 'AWS'),
  ('cloudflare', 'Cloudflare', 'Cloudflare'),
  ('serverless', 'サーバーレス', 'Serverless'),
  ('devops', 'DevOps・CI/CD', 'DevOps & CI/CD'),
  ('security', 'セキュリティ', 'Security'),
  ('database', 'データベース', 'Database'),
  ('opensource', 'オープンソース', 'Open Source'),
  ('testing', 'テスト', 'Testing'),
  ('mobile', 'モバイル', 'Mobile')
on conflict (slug) do nothing;
