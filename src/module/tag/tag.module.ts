import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { StoreModule } from '../store/store.module';

@Module({
  controllers: [TagController],
  providers: [TagService],
  imports: [StoreModule],
})
export class TagModule {}
