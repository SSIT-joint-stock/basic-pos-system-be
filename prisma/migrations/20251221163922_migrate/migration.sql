/*
  Warnings:

  - The values [TRANSFER] on the enum `stock_movement_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `product_id` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `stock_movement` table. All the data in the column will be lost.
  - You are about to drop the `inventory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[store_id,sku]` on the table `product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,name]` on the table `tag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `store_id` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variant_id` to the `order_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baseUnit` to the `product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variant_id` to the `stock_movement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `tag` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'product_type'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "public"."product_type" AS ENUM ('PURCHASE', 'QUICK_CREATE');
  END IF;
END$$;

-- CreateEnum
CREATE TYPE "public"."supplier_status" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETE');

-- CreateEnum
CREATE TYPE "public"."payment_status" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."purchase_order_status" AS ENUM ('PENDING', 'RECEIVED');

-- AlterEnum

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "public"."order_status" ADD VALUE IF NOT EXISTS 'OVERAGE';
ALTER TYPE "public"."payment_method" ADD VALUE IF NOT EXISTS 'BANK_TRANSFER';
ALTER TYPE "public"."payment_method" ADD VALUE IF NOT EXISTS 'DIGITAL_WALLET';

-- AlterEnum
BEGIN;
CREATE TYPE "public"."stock_movement_type_new" AS ENUM ('ADJUSTMENT', 'PURCHASE', 'SALE', 'RETURN_PURCHASE', 'RETURN_SALE', 'TRANSFER_IMPORT', 'TRANSFER_EXPORT');
ALTER TABLE "public"."stock_movement" ALTER COLUMN "type" TYPE "public"."stock_movement_type_new" USING ("type"::text::"public"."stock_movement_type_new");
ALTER TYPE "public"."stock_movement_type" RENAME TO "stock_movement_type_old";
ALTER TYPE "public"."stock_movement_type_new" RENAME TO "stock_movement_type";
DROP TYPE "public"."stock_movement_type_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."inventory" DROP CONSTRAINT "inventory_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order" DROP CONSTRAINT "order_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."stock_movement" DROP CONSTRAINT "stock_movement_product_id_fkey";

-- DropIndex
DROP INDEX "public"."order_product_id_idx";

-- DropIndex
DROP INDEX "public"."product_sku_key";

-- DropIndex
DROP INDEX "public"."stock_movement_product_id_idx";

-- AlterTable
ALTER TABLE "public"."order" DROP COLUMN "product_id",
ADD COLUMN     "change_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "customer_pay_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "store_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."order_item" ADD COLUMN     "discount_rate" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "tax_rate" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "variant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."product" DROP COLUMN "cost",
DROP COLUMN "price",
ADD COLUMN     "baseUnit" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "is_deleted" BOOLEAN DEFAULT false,
ADD COLUMN     "is_set_default_variant" BOOLEAN DEFAULT true,
ADD COLUMN     "source_type" "public"."product_type" NOT NULL DEFAULT 'QUICK_CREATE';

-- AlterTable
ALTER TABLE "public"."stock_movement" DROP COLUMN "product_id",
ADD COLUMN     "variant_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "public"."store" ADD COLUMN     "address" TEXT,
ADD COLUMN     "business_hour" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "public"."tag" ADD COLUMN     "store_id" UUID NOT NULL;

-- DropTable
DROP TABLE "public"."inventory";

-- CreateTable
CREATE TABLE "public"."store_payment" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "bank_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "bank_account_number" TEXT NOT NULL,
    "bank_account_name" TEXT NOT NULL,
    "bank_qr_image_url" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "store_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."store_reward_point" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "convert_to" VARCHAR(255) NOT NULL DEFAULT 'VND',
    "convert_rate" INTEGER NOT NULL DEFAULT 100000,
    "point_value" INTEGER NOT NULL DEFAULT 5000,
    "description" VARCHAR(255),
    "is_apply" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_reward_point_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."supplier" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "address" TEXT,
    "tax_code" TEXT,
    "email" TEXT DEFAULT '',
    "phone" TEXT,
    "bank_account" JSONB,
    "notes" TEXT,
    "status" "public"."supplier_status" NOT NULL DEFAULT 'ACTIVE',
    "total_purchased" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variant" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "cost" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variant_stocks" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER DEFAULT 0,
    "damaged" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."unit_conversions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "factor" INTEGER NOT NULL,
    "variantId" UUID NOT NULL,

    CONSTRAINT "unit_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_template" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "description" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "supplier_id" UUID NOT NULL,
    "supplier_code" TEXT,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "status" "public"."purchase_order_status" NOT NULL DEFAULT 'PENDING',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "shipping_fee" DECIMAL(15,2) DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_method" "public"."payment_method",
    "payment_status" "public"."payment_status" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order_item" (
    "id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "item_name" TEXT NOT NULL DEFAULT '',
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT,
    "applied_factor" INTEGER,
    "total_base_qty" INTEGER,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "discount_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "purchase_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_payment" (
    "id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "payment_method" "public"."payment_method" NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "purchase_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_payment_store_id_idx" ON "public"."store_payment"("store_id");

-- CreateIndex
CREATE INDEX "store_reward_point_store_id_idx" ON "public"."store_reward_point"("store_id");

-- CreateIndex
CREATE INDEX "supplier_store_id_status_idx" ON "public"."supplier"("store_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_store_id_code_key" ON "public"."supplier"("store_id", "code");

-- CreateIndex
CREATE INDEX "variant_product_id_name_idx" ON "public"."variant"("product_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "variant_product_id_name_key" ON "public"."variant"("product_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "variant_product_id_sku_key" ON "public"."variant"("product_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "variant_stocks_variant_id_store_id_key" ON "public"."variant_stocks"("variant_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "unit_conversions_variantId_name_key" ON "public"."unit_conversions"("variantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_template_barcode_key" ON "public"."product_template"("barcode");

-- CreateIndex
CREATE INDEX "purchase_order_store_id_status_order_date_idx" ON "public"."purchase_order"("store_id", "status", "order_date");

-- CreateIndex
CREATE INDEX "purchase_order_supplier_id_status_idx" ON "public"."purchase_order"("supplier_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_store_id_order_number_key" ON "public"."purchase_order"("store_id", "order_number");

-- CreateIndex
CREATE INDEX "purchase_order_item_purchase_order_id_idx" ON "public"."purchase_order_item"("purchase_order_id");

-- CreateIndex
CREATE INDEX "purchase_order_item_product_id_idx" ON "public"."purchase_order_item"("product_id");

-- CreateIndex
CREATE INDEX "purchase_payment_purchase_order_id_idx" ON "public"."purchase_payment"("purchase_order_id");

-- CreateIndex
CREATE INDEX "order_item_variant_id_idx" ON "public"."order_item"("variant_id");

-- CreateIndex
CREATE INDEX "product_store_id_sku_idx" ON "public"."product"("store_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_store_id_sku_key" ON "public"."product"("store_id", "sku");

-- CreateIndex
CREATE INDEX "stock_movement_variant_id_idx" ON "public"."stock_movement"("variant_id");

-- CreateIndex
CREATE INDEX "tag_store_id_idx" ON "public"."tag"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_store_id_name_key" ON "public"."tag"("store_id", "name");

-- AddForeignKey
ALTER TABLE "public"."store_payment" ADD CONSTRAINT "store_payment_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_reward_point" ADD CONSTRAINT "store_reward_point_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier" ADD CONSTRAINT "supplier_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant" ADD CONSTRAINT "variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_stocks" ADD CONSTRAINT "variant_stocks_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_stocks" ADD CONSTRAINT "variant_stocks_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unit_conversions" ADD CONSTRAINT "unit_conversions_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tag" ADD CONSTRAINT "tag_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movement" ADD CONSTRAINT "stock_movement_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order" ADD CONSTRAINT "order_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order" ADD CONSTRAINT "purchase_order_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order" ADD CONSTRAINT "purchase_order_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order" ADD CONSTRAINT "purchase_order_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order" ADD CONSTRAINT "purchase_order_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_item" ADD CONSTRAINT "purchase_order_item_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_item" ADD CONSTRAINT "purchase_order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_item" ADD CONSTRAINT "purchase_order_item_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_payment" ADD CONSTRAINT "purchase_payment_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
