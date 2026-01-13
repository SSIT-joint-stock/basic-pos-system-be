import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { BadRequestError } from 'app/common/response';
import { AssetsService } from '../assets.service';

@Injectable()
export class AssetAccessGuard implements CanActivate {
  constructor(private readonly assetsService: AssetsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const assetId = request.params?.id;

    if (!assetId) {
      throw new BadRequestError('Asset id is required');
    }

    const userId = request.user?.id as string | undefined;
    const asset = await this.assetsService.getAssetForRead(assetId, userId);

    request.asset = asset;

    return true;
  }
}
