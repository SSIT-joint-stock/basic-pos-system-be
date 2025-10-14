import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Generate multiple unique SKUs for a batch of products EX: SP00001, SP00002
 */
export async function generateSkuBatch(
  prisma: Prisma.TransactionClient | PrismaClient,
  storeId: string,
  count: number,
): Promise<string[]> {
  const lastSku = await prisma.product.findFirst({
    where: { store_id: storeId, sku: { startsWith: 'SP' } },
    orderBy: { sku: 'desc' },
  });

  const startNumber =
    lastSku && lastSku.sku ? parseInt(lastSku.sku.slice(2)) + 1 : 1;

  // Generate array of SKUs
  const skus: string[] = [];
  for (let i = 0; i < count; i++) {
    const sku = `SP${(startNumber + i).toString().padStart(5, '0')}`;
    skus.push(sku);
  }

  return skus;
}

/**
 * Generate single unique SKU
 */
export async function generateSku(storeId: string): Promise<string> {
  const prisma = new PrismaClient();
  try {
    const skus = await generateSkuBatch(prisma, storeId, 1);
    return skus[0];
  } finally {
    await prisma.$disconnect();
  }
}
