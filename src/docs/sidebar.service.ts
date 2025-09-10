import * as fs from 'node:fs';
import * as path from 'node:path';
import { renderMarkdown } from './markdown.util';

export type SidebarItem =
  | { type: 'doc'; label: string; id: string }
  | { type: 'category'; label: string; items: SidebarItem[] };

export class SidebarService {
  constructor(private readonly docsRoot: string) {}

  getSidebar(): SidebarItem[] {
    return this.walkDir(this.docsRoot, this.docsRoot);
  }

  private walkDir(dir: string, base: string): SidebarItem[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const items: SidebarItem[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sub = this.walkDir(path.join(dir, entry.name), base);
        items.push({ type: 'category', label: entry.name, items: sub });
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const id = path
          .relative(base, path.join(dir, entry.name))
          .replace(/\.md$/, '');
        items.push({
          type: 'doc',
          label: path.basename(entry.name, '.md'),
          id,
        });
      }
    }
    return items;
  }

  async getDoc(id: string) {
    const file = path.join(this.docsRoot, `${id}.md`);
    const raw = await fs.promises.readFile(file, 'utf8');
    const html = await renderMarkdown(raw);
    return { id, html };
  }
}
