-- CreateEnum
CREATE TYPE "public"."user_role" AS ENUM ('ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "public"."StoreMemberRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."user_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."order_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "public"."inventory_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD');

-- CreateEnum
CREATE TYPE "public"."product_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD');

-- CreateEnum
CREATE TYPE "public"."stock_movement_type" AS ENUM ('ADJUSTMENT', 'PURCHASE', 'SALE', 'RETURN_PURCHASE', 'RETURN_SALE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "public"."payment_method" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD');

-- CreateTable
CREATE TABLE "public"."user" (
    "id" UUID NOT NULL,
    "providerId" TEXT,
    "provider" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "username" TEXT NOT NULL,
    "role" "public"."user_role" NOT NULL DEFAULT 'USER',
    "status" "public"."user_status" NOT NULL DEFAULT 'ACTIVE',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "refresh_token" TEXT,
    "verification_code" TEXT,
    "verification_code_expired" TIMESTAMP(3),
    "password_reset_code" TEXT,
    "password_reset_code_expired" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."store" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."store_member" (
    "storeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "public"."StoreMemberRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_member_pkey" PRIMARY KEY ("storeId","userId")
);

-- CreateTable
CREATE TABLE "public"."customer" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("store_id","id")
);

-- CreateTable
CREATE TABLE "public"."product" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "description" TEXT,
    "product_status" "public"."product_status" NOT NULL DEFAULT 'ACTIVE',
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_by" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."inventory_status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tag" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_movement" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" "public"."stock_movement_type" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order" (
    "id" UUID NOT NULL,
    "code" TEXT,
    "product_id" UUID NOT NULL,
    "cashier_id" UUID NOT NULL,
    "customer_id" UUID,
    "customer_name" TEXT,
    "subtotal_amount" INTEGER NOT NULL DEFAULT 0,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "tax_amount" INTEGER NOT NULL DEFAULT 0,
    "total_amount" INTEGER NOT NULL DEFAULT 0,
    "payment_method" "public"."payment_method" NOT NULL DEFAULT 'CASH',
    "status" "public"."order_status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_item" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "price" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."statistics_daily" (
    "id" UUID NOT NULL,
    "stat_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "store_id" UUID NOT NULL,
    "orders_count" INTEGER NOT NULL DEFAULT 0,
    "paid_orders_count" INTEGER NOT NULL DEFAULT 0,
    "cancelled_orders_count" INTEGER NOT NULL DEFAULT 0,
    "refunded_orders_count" INTEGER NOT NULL DEFAULT 0,
    "gross_revenue" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "discounts_total" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "tax_total" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "net_revenue" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "units_sold" INTEGER NOT NULL DEFAULT 0,
    "units_returned" INTEGER NOT NULL DEFAULT 0,
    "stock_in_units" INTEGER NOT NULL DEFAULT 0,
    "stock_out_units" INTEGER NOT NULL DEFAULT 0,
    "stock_net_units" INTEGER NOT NULL DEFAULT 0,
    "product_created" INTEGER NOT NULL DEFAULT 0,
    "active_product" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "statistics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ProductToTag" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ProductToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_CategoryToProduct" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CategoryToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "public"."user"("username");

-- CreateIndex
CREATE INDEX "user_role_status_idx" ON "public"."user"("role", "status");

-- CreateIndex
CREATE INDEX "store_owner_id_idx" ON "public"."store"("owner_id");

-- CreateIndex
CREATE INDEX "store_name_idx" ON "public"."store"("name");

-- CreateIndex
CREATE INDEX "store_member_userId_idx" ON "public"."store_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_id_key" ON "public"."customer"("id");

-- CreateIndex
CREATE INDEX "customer_store_id_idx" ON "public"."customer"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_sku_key" ON "public"."product"("sku");

-- CreateIndex
CREATE INDEX "product_created_by_product_status_name_idx" ON "public"."product"("created_by", "product_status", "name");

-- CreateIndex
CREATE INDEX "inventory_product_id_status_idx" ON "public"."inventory"("product_id", "status");

-- CreateIndex
CREATE INDEX "category_store_id_idx" ON "public"."category"("store_id");

-- CreateIndex
CREATE INDEX "category_name_idx" ON "public"."category"("name");

-- CreateIndex
CREATE INDEX "tag_name_idx" ON "public"."tag"("name");

-- CreateIndex
CREATE INDEX "stock_movement_product_id_idx" ON "public"."stock_movement"("product_id");

-- CreateIndex
CREATE INDEX "order_cashier_id_idx" ON "public"."order"("cashier_id");

-- CreateIndex
CREATE INDEX "order_customer_id_idx" ON "public"."order"("customer_id");

-- CreateIndex
CREATE INDEX "order_product_id_idx" ON "public"."order"("product_id");

-- CreateIndex
CREATE INDEX "order_status_idx" ON "public"."order"("status");

-- CreateIndex
CREATE INDEX "order_item_order_id_idx" ON "public"."order_item"("order_id");

-- CreateIndex
CREATE INDEX "order_item_product_id_idx" ON "public"."order_item"("product_id");

-- CreateIndex
CREATE INDEX "statistics_daily_store_id_idx" ON "public"."statistics_daily"("store_id");

-- CreateIndex
CREATE INDEX "statistics_daily_stat_date_idx" ON "public"."statistics_daily"("stat_date");

-- CreateIndex
CREATE INDEX "_ProductToTag_B_index" ON "public"."_ProductToTag"("B");

-- CreateIndex
CREATE INDEX "_CategoryToProduct_B_index" ON "public"."_CategoryToProduct"("B");

-- AddForeignKey
ALTER TABLE "public"."store" ADD CONSTRAINT "store_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_member" ADD CONSTRAINT "store_member_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_member" ADD CONSTRAINT "store_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer" ADD CONSTRAINT "customer_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product" ADD CONSTRAINT "product_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product" ADD CONSTRAINT "product_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category" ADD CONSTRAINT "category_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movement" ADD CONSTRAINT "stock_movement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order" ADD CONSTRAINT "order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order" ADD CONSTRAINT "order_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order" ADD CONSTRAINT "order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."statistics_daily" ADD CONSTRAINT "statistics_daily_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProductToTag" ADD CONSTRAINT "_ProductToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProductToTag" ADD CONSTRAINT "_ProductToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
