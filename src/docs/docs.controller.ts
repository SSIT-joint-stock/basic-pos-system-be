import * as nodePath from 'node:path';
import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SidebarService } from './sidebar.service';
import { DocsService } from './docs.service';
import { Logger } from '@nestjs/common';
import { Public } from 'app/common/decorators/public.decorator';

@Controller('docs')
export class DocsController {
  private logger = new Logger(DocsController.name);
  private docsRoot: string;
  private sidebar: SidebarService;
  private service: DocsService;
  constructor() {
    this.docsRoot = nodePath.join(process.cwd(), 'docs');
    this.sidebar = new SidebarService(this.docsRoot);
    this.service = new DocsService(this.docsRoot);
  }

  @Public()
  @Get('sidebar')
  getSidebar() {
    return this.sidebar.getSidebar();
  }

  @Public()
  @Get('page/*path')
  async getPage(@Param('path') path: string, @Res() res: Response) {
    let id = path.replace(',', '/');
    if (id.endsWith('.md')) {
      id = id.replace('.md', '');
    } else if (id.endsWith('/')) {
      id = id.replace('/', '');
    } else if (id.endsWith('.png')) {
      res
        .setHeader('Content-Type', 'image/png')
        .sendFile(nodePath.join(this.docsRoot, id));
      return;
    } else if (id.endsWith('.jpg')) {
      res
        .setHeader('Content-Type', 'image/jpg')
        .sendFile(nodePath.join(this.docsRoot, id));
      return;
    } else if (id.endsWith('.jpeg')) {
      res
        .setHeader('Content-Type', 'image/jpeg')
        .sendFile(nodePath.join(this.docsRoot, id));
      return;
    } else if (id.endsWith('.gif')) {
      res
        .setHeader('Content-Type', 'image/gif')
        .sendFile(nodePath.join(this.docsRoot, id));
      return;
    } else if (id.endsWith('.svg')) {
      res
        .setHeader('Content-Type', 'image/svg+xml')
        .sendFile(nodePath.join(this.docsRoot, id));
      return;
    }

    this.logger.log(`Rendering doc: ${id}`);
    const doc = await this.service.renderDoc(id);
    this.logger.log(`Doc rendered: ${doc.id}`);
    const sidebar = this.sidebar.getSidebar();

    const html = await this.service.renderDocTemplate('layout', {
      title: doc.id,
      content: doc.html,
      sidebar,
      activeId: id,
    });

    res.setHeader('Content-Type', 'text/html').send(html);
  }
}
