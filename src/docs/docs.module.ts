import { Module } from '@nestjs/common';
import { DocsController } from './docs.controller';
import { DocsService } from './docs.service';
import { SidebarService } from './sidebar.service';

@Module({
  controllers: [DocsController],
  providers: [DocsService, SidebarService],
})
export class DocsModule {}
