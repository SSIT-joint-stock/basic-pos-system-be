import * as fs from 'node:fs';
import * as path from 'node:path';
import { renderMarkdown } from './markdown.util';
import * as handlebars from 'handlebars';

export class DocsService {
  private handlebars: typeof handlebars;
  private viewsDir: string;
  private partialsDir: string;
  constructor(private docsRoot: string) {
    this.viewsDir = path.join(process.cwd(), 'src', 'docs', 'templates');
    this.partialsDir = path.join(this.viewsDir, 'partials');
    this.handlebars = handlebars.create();
    fs.readdirSync(this.partialsDir).forEach((file) => {
      if (file.endsWith('.hbs')) {
        const name = path.basename(file, '.hbs');
        const tpl = fs.readFileSync(path.join(this.partialsDir, file), 'utf8');
        this.handlebars.registerPartial(name, tpl);
      }
    });
    this.handlebars.registerHelper('eq', (a, b) => a === b);
  }

  async renderDoc(id: string) {
    const file = path.join(this.docsRoot, `${id}.md`);
    const raw = await fs.promises.readFile(file, 'utf8');
    const html = await renderMarkdown(raw);
    return { id, html };
  }

  async renderDocTemplate(templateName: string, context: any): Promise<string> {
    const tplPath = path.join(this.viewsDir, `${templateName}.hbs`);
    const tplStr = await fs.promises.readFile(tplPath, 'utf8');
    const template = this.handlebars.compile(tplStr);
    return template(context);
  }
}
