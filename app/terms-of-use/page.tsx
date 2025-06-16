import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import UnifiedHeader from '@/components/UnifiedHeader';

export default async function TermsOfUse() {
  const filePath = path.join(process.cwd(), 'content', 'terms-of-use.md');
  const content = await fs.promises.readFile(filePath, 'utf8');

  return (
    <main className="container mx-auto p-4 font-neuemontreal">
      <UnifiedHeader variant="page" title="TERMS OF USE" showBack={true} />
      <h1 className="text-2xl font-neuebit mb-4">Terms Of Use</h1>
      <ReactMarkdown>{content}</ReactMarkdown>
    </main>
  );
}
