import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
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

    const storeId = request.params?.storeId as string | undefined;
    if (!storeId) {
      throw new BadRequestError('StoreIdRequired', 'STORE_ID_REQUIRED');
    }

    const userId = request.user?.id as string | undefined;
    const asset = await this.assetsService.getAssetForRead(
      assetId,
      storeId,
      userId,
    );

    request.asset = asset;

    return true;
  }
}
