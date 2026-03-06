import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Asset, asset_access_type, user_role } from '@prisma/client';
import { IUser } from 'app/common/types/user.type';
import { storageConfig } from 'app/config';
import { PrismaService } from 'app/prisma/prisma.service';
import { AssetsService } from './assets.service';
import { FileValidatorService } from './services/file-validator.service';

describe('AssetsService', () => {
  let service: AssetsService;
  let prisma: PrismaService;
  let storage: any;

  const mockUser: IUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    role: user_role.USER,
    status: 'ACTIVE',
    storeId: 'store-1',
  };

  const mockAdmin: IUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    username: 'adminuser',
    role: user_role.ADMIN,
    status: 'ACTIVE',
    storeId: 'store-1',
  };

  const mockAsset: Asset = {
    id: 'asset-1',
    store_id: 'store-1',
    original_name: 'test.png',
    filename: 'unique.png',
    mime_type: 'image/png',
    size: 100,
    path: 'public/unique.png',
    access_type: asset_access_type.PUBLIC,
    type: 'IMAGE',
    folder: null,
    metadata: {},
    is_deleted: false,
    uploaded_by_id: 'user-1',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    storage = {
      save: jest.fn(),
      delete: jest.fn(),
      getStream: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: PrismaService,
          useValue: {
            asset: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: 'IStorageService',
          useValue: storage,
        },
        {
          provide: FileValidatorService,
          useValue: {
            validateFile: jest.fn(),
          },
        },
        {
          provide: storageConfig.KEY,
          useValue: {
            cdnUrl: 'https://cdn.example.com',
          },
        },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('checkPermission', () => {
    it('should allow Admin to do anything', () => {
      const result = service.checkPermission(mockAsset, mockAdmin, 'DELETE');
      expect(result).toBe(true);
    });

    it('should allow Owner to do anything', () => {
      const result = service.checkPermission(mockAsset, mockUser, 'DELETE');
      expect(result).toBe(true);
    });

    it('should allow anyone to READ public assets', () => {
      const otherUser: IUser = { ...mockUser, id: 'user-2' };
      const result = service.checkPermission(mockAsset, otherUser, 'READ');
      expect(result).toBe(true);
    });

    it('should NOT allow other users to DELETE assets', () => {
      const otherUser: IUser = { ...mockUser, id: 'user-2' };
      const result = service.checkPermission(mockAsset, otherUser, 'DELETE');
      expect(result).toBe(false);
    });

    it('should NOT allow other users to READ private assets', () => {
      const privateAsset = {
        ...mockAsset,
        access_type: asset_access_type.PRIVATE,
      };
      const otherUser: IUser = { ...mockUser, id: 'user-2' };
      const result = service.checkPermission(
        privateAsset as Asset,
        otherUser,
        'READ',
      );
      expect(result).toBe(false);
    });
  });

  describe('getAsset', () => {
    it('should return asset if found', async () => {
      jest
        .spyOn(prisma.asset, 'findUnique')
        .mockResolvedValue(mockAsset as any);
      const result = await service.getAsset('asset-1');
      expect(result.id).toBe('asset-1');
      expect(result.url).toContain('https://cdn.example.com');
    });

    it('should throw NotFoundException if not found', async () => {
      jest.spyOn(prisma.asset, 'findUnique').mockResolvedValue(null);
      await expect(service.getAsset('none')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cleanupTempAssets', () => {
    it('should delete temp assets older than 24h', async () => {
      const oldTempAsset = {
        ...mockAsset,
        access_type: asset_access_type.TEMP,
        id: 'old-1',
      };
      jest
        .spyOn(prisma.asset, 'findMany')
        .mockResolvedValue([oldTempAsset as any]);
      const updateSpy = jest
        .spyOn(prisma.asset, 'update')
        .mockResolvedValue({} as any);

      await service.cleanupTempAssets();

      expect(storage.delete).toHaveBeenCalledWith(oldTempAsset.path);
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'old-1' },
        data: { is_deleted: true },
      });
    });
  });
});
