-- CreateEnum
CREATE TYPE "public"."user_role" AS ENUM ('ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "public"."StoreMemberRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."user_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."order_status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'RETURNED', 'OVERAGE');

-- CreateEnum
CREATE TYPE "public"."order_return_status" AS ENUM ('REQUESTED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."order_return_type" AS ENUM ('NONE', 'FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "public"."order_item_return_reason" AS ENUM ('PRODUCT_DEFECT', 'WRONG_PRODUCT', 'NOT_AS_DESCRIBED', 'EXPIRED', 'INCOMPLETE', 'POOR_QUALITY', 'SHIPPING_DAMAGE', 'LATE_DELIVERY', 'CHANGE_OF_MIND', 'SIZE_UNFIT', 'ACCIDENTAL_ORDER', 'BETTER_PRICE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."inventory_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD');

-- CreateEnum
CREATE TYPE "public"."product_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD');

-- CreateEnum
CREATE TYPE "public"."product_type" AS ENUM ('PURCHASE', 'QUICK_CREATE');

-- CreateEnum
CREATE TYPE "public"."provider_type" AS ENUM ('GOOGLE', 'FACEBOOK', 'GITHUB', 'MANUAL');

-- CreateEnum
CREATE TYPE "public"."stock_movement_type" AS ENUM ('ADJUSTMENT', 'PURCHASE', 'SALE', 'RETURN_PURCHASE', 'RETURN_SALE', 'TRANSFER_IMPORT', 'TRANSFER_EXPORT');

-- CreateEnum
CREATE TYPE "public"."payment_method" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET');

-- CreateEnum
CREATE TYPE "public"."transaction_type" AS ENUM ('RECEIPT', 'PAYMENT');

-- CreateEnum
CREATE TYPE "public"."transaction_source" AS ENUM ('SALE', 'PURCHASE', 'ORDER_RETURN', 'PURCHASE_RETURN', 'CUSTOMER_DEBT', 'SUPPLIER_DEBT', 'OTHER_INCOME', 'OTHER_EXPENSE', 'OPENING_BALANCE');

-- CreateEnum
CREATE TYPE "public"."transaction_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."supplier_status" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETE');

-- CreateEnum
CREATE TYPE "public"."payment_status" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."purchase_order_status" AS ENUM ('PENDING', 'RECEIVED');

-- CreateEnum
CREATE TYPE "public"."purchase_return_status" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."user" (
    "id" UUID NOT NULL,
    "provider_id" TEXT,
    "provider" "public"."provider_type" DEFAULT 'MANUAL',
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
    "phone_number" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "business_hour" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "public"."product" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "baseUnit" TEXT NOT NULL,
    "barcode" TEXT,
    "image_url" TEXT,
    "description" TEXT,
    "product_status" "public"."product_status" NOT NULL DEFAULT 'ACTIVE',
    "meta" JSONB NOT NULL DEFAULT '{}',
    "source_type" "public"."product_type" NOT NULL DEFAULT 'QUICK_CREATE',
    "is_set_default_variant" BOOLEAN DEFAULT true,
    "is_deleted" BOOLEAN DEFAULT false,
    "created_by" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
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
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_movement" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
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
    "cashier_id" UUID NOT NULL,
    "customer_id" UUID,
    "customer_name" TEXT,
    "store_id" UUID NOT NULL,
    "customer_pay_amount" INTEGER NOT NULL DEFAULT 0,
    "change_amount" INTEGER NOT NULL DEFAULT 0,
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
    "variant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "quantity_return" INTEGER DEFAULT 0,
    "discount_rate" DECIMAL(65,30) DEFAULT 0,
    "tax_rate" DECIMAL(65,30) DEFAULT 0,
    "price" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_return" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "created_id" UUID NOT NULL,
    "customer_id" UUID,
    "order_number" TEXT NOT NULL,
    "order_return_number" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "reason" TEXT,
    "return_type" "public"."order_return_type" NOT NULL DEFAULT 'NONE',
    "return_status" "public"."order_return_status" NOT NULL DEFAULT 'REQUESTED',
    "total" DECIMAL(15,2) NOT NULL,
    "suggest_total" DECIMAL(15,2) NOT NULL,
    "items_length" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_return_item" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "order_return_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quantity_refunded" INTEGER NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "reason_status" "public"."order_item_return_reason" NOT NULL DEFAULT 'UNKNOWN',
    "condition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_return_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_return_payment" (
    "id" UUID NOT NULL,
    "order_return_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" "public"."payment_method" NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "order_return_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "order_number" TEXT NOT NULL,
    "supplier_id" UUID NOT NULL,
    "supplier_code" TEXT,
    "supplier_name" TEXT NOT NULL DEFAULT '',
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
    "quantity_returned" DECIMAL(10,2),
    "unit" TEXT,
    "applied_factor" INTEGER,
    "total_base_qty" INTEGER,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "discount_rate" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(15,2) NOT NULL DEFAULT 0,
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

-- CreateTable
CREATE TABLE "public"."purchase_return" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "return_number" TEXT NOT NULL,
    "supplier_id" UUID NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "supplier_code" TEXT,
    "purchase_order_id" UUID,
    "status" "public"."purchase_return_status" NOT NULL DEFAULT 'DRAFT',
    "payment_status" "public"."payment_status" NOT NULL DEFAULT 'UNPAID',
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "return_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_return_item" (
    "id" UUID NOT NULL,
    "purchase_return_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "purchase_order_item_id" UUID,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "applied_factor" INTEGER,
    "total_base_qty" INTEGER,
    "unit_cost" DECIMAL(15,2) NOT NULL,
    "base_unit_cost" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "purchase_return_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_return_payment" (
    "id" UUID NOT NULL,
    "purchase_return_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" "public"."payment_method" NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_return_payment_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."cash_transaction" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "store_id" UUID NOT NULL,
    "transaction_type" "public"."transaction_type" NOT NULL,
    "transaction_source" "public"."transaction_source" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" "public"."payment_method" NOT NULL,
    "reference_type" TEXT,
    "reference_id" UUID,
    "contact_type" TEXT,
    "contact_id" UUID,
    "contact_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "status" "public"."transaction_status" NOT NULL DEFAULT 'PENDING',
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "cancelled_by" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cash_book_entry" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "opening_balance" DECIMAL(15,2) NOT NULL,
    "total_receipts" DECIMAL(15,2) NOT NULL,
    "total_payments" DECIMAL(15,2) NOT NULL,
    "closing_balance" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_book_entry_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "store_payment_store_id_idx" ON "public"."store_payment"("store_id");

-- CreateIndex
CREATE INDEX "store_reward_point_store_id_idx" ON "public"."store_reward_point"("store_id");

-- CreateIndex
CREATE INDEX "store_member_userId_idx" ON "public"."store_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_id_key" ON "public"."customer"("id");

-- CreateIndex
CREATE INDEX "customer_store_id_idx" ON "public"."customer"("store_id");

-- CreateIndex
CREATE INDEX "supplier_store_id_status_idx" ON "public"."supplier"("store_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_store_id_code_key" ON "public"."supplier"("store_id", "code");

-- CreateIndex
CREATE INDEX "product_store_id_sku_idx" ON "public"."product"("store_id", "sku");

-- CreateIndex
CREATE INDEX "product_created_by_product_status_name_idx" ON "public"."product"("created_by", "product_status", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_store_id_sku_key" ON "public"."product"("store_id", "sku");

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
CREATE INDEX "category_store_id_idx" ON "public"."category"("store_id");

-- CreateIndex
CREATE INDEX "category_name_idx" ON "public"."category"("name");

-- CreateIndex
CREATE INDEX "tag_store_id_idx" ON "public"."tag"("store_id");

-- CreateIndex
CREATE INDEX "tag_name_idx" ON "public"."tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tag_store_id_name_key" ON "public"."tag"("store_id", "name");

-- CreateIndex
CREATE INDEX "stock_movement_variant_id_idx" ON "public"."stock_movement"("variant_id");

-- CreateIndex
CREATE INDEX "order_cashier_id_idx" ON "public"."order"("cashier_id");

-- CreateIndex
CREATE INDEX "order_customer_id_idx" ON "public"."order"("customer_id");

-- CreateIndex
CREATE INDEX "order_status_idx" ON "public"."order"("status");

-- CreateIndex
CREATE INDEX "order_item_order_id_idx" ON "public"."order_item"("order_id");

-- CreateIndex
CREATE INDEX "order_item_variant_id_idx" ON "public"."order_item"("variant_id");

-- CreateIndex
CREATE INDEX "order_item_product_id_idx" ON "public"."order_item"("product_id");

-- CreateIndex
CREATE INDEX "order_return_order_id_idx" ON "public"."order_return"("order_id");

-- CreateIndex
CREATE INDEX "order_return_order_number_idx" ON "public"."order_return"("order_number");

-- CreateIndex
CREATE INDEX "order_return_order_return_number_idx" ON "public"."order_return"("order_return_number");

-- CreateIndex
CREATE INDEX "order_return_customer_name_idx" ON "public"."order_return"("customer_name");

-- CreateIndex
CREATE UNIQUE INDEX "order_return_store_id_order_return_number_key" ON "public"."order_return"("store_id", "order_return_number");

-- CreateIndex
CREATE INDEX "order_return_item_order_return_id_idx" ON "public"."order_return_item"("order_return_id");

-- CreateIndex
CREATE INDEX "order_return_item_variant_id_idx" ON "public"."order_return_item"("variant_id");

-- CreateIndex
CREATE INDEX "order_return_item_product_id_idx" ON "public"."order_return_item"("product_id");

-- CreateIndex
CREATE INDEX "order_return_payment_order_return_id_idx" ON "public"."order_return_payment"("order_return_id");

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
CREATE INDEX "purchase_return_supplier_id_status_idx" ON "public"."purchase_return"("supplier_id", "status");

-- CreateIndex
CREATE INDEX "purchase_return_id_return_number_idx" ON "public"."purchase_return"("id", "return_number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_return_store_id_return_number_key" ON "public"."purchase_return"("store_id", "return_number");

-- CreateIndex
CREATE INDEX "purchase_return_item_purchase_return_id_idx" ON "public"."purchase_return_item"("purchase_return_id");

-- CreateIndex
CREATE INDEX "purchase_return_payment_purchase_return_id_idx" ON "public"."purchase_return_payment"("purchase_return_id");

-- CreateIndex
CREATE INDEX "statistics_daily_store_id_idx" ON "public"."statistics_daily"("store_id");

-- CreateIndex
CREATE INDEX "statistics_daily_stat_date_idx" ON "public"."statistics_daily"("stat_date");

-- CreateIndex
CREATE INDEX "cash_transaction_store_id_transaction_date_idx" ON "public"."cash_transaction"("store_id", "transaction_date");

-- CreateIndex
CREATE INDEX "cash_transaction_store_id_transaction_type_idx" ON "public"."cash_transaction"("store_id", "transaction_type");

-- CreateIndex
CREATE INDEX "cash_transaction_store_id_code_idx" ON "public"."cash_transaction"("store_id", "code");

-- CreateIndex
CREATE INDEX "cash_transaction_reference_type_reference_id_idx" ON "public"."cash_transaction"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "cash_transaction_contact_type_contact_id_idx" ON "public"."cash_transaction"("contact_type", "contact_id");

-- CreateIndex
CREATE INDEX "cash_book_entry_store_id_date_idx" ON "public"."cash_book_entry"("store_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "cash_book_entry_store_id_date_key" ON "public"."cash_book_entry"("store_id", "date");

-- CreateIndex
CREATE INDEX "_ProductToTag_B_index" ON "public"."_ProductToTag"("B");

-- CreateIndex
CREATE INDEX "_CategoryToProduct_B_index" ON "public"."_CategoryToProduct"("B");

-- AddForeignKey
ALTER TABLE "public"."store" ADD CONSTRAINT "store_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_payment" ADD CONSTRAINT "store_payment_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_reward_point" ADD CONSTRAINT "store_reward_point_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_member" ADD CONSTRAINT "store_member_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."store_member" ADD CONSTRAINT "store_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer" ADD CONSTRAINT "customer_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."supplier" ADD CONSTRAINT "supplier_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product" ADD CONSTRAINT "product_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product" ADD CONSTRAINT "product_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant" ADD CONSTRAINT "variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_stocks" ADD CONSTRAINT "variant_stocks_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_stocks" ADD CONSTRAINT "variant_stocks_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unit_conversions" ADD CONSTRAINT "unit_conversions_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category" ADD CONSTRAINT "category_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tag" ADD CONSTRAINT "tag_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movement" ADD CONSTRAINT "stock_movement_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order" ADD CONSTRAINT "order_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order" ADD CONSTRAINT "order_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order" ADD CONSTRAINT "order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_return" ADD CONSTRAINT "order_return_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_return" ADD CONSTRAINT "order_return_created_id_fkey" FOREIGN KEY ("created_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_return" ADD CONSTRAINT "order_return_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_return" ADD CONSTRAINT "order_return_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_return_item" ADD CONSTRAINT "order_return_item_order_return_id_fkey" FOREIGN KEY ("order_return_id") REFERENCES "public"."order_return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_return_item" ADD CONSTRAINT "order_return_item_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_return_item" ADD CONSTRAINT "order_return_item_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_return_item" ADD CONSTRAINT "order_return_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_return_payment" ADD CONSTRAINT "order_return_payment_order_return_id_fkey" FOREIGN KEY ("order_return_id") REFERENCES "public"."order_return"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "public"."purchase_return" ADD CONSTRAINT "purchase_return_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_return" ADD CONSTRAINT "purchase_return_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_return" ADD CONSTRAINT "purchase_return_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_return" ADD CONSTRAINT "purchase_return_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_return_item" ADD CONSTRAINT "purchase_return_item_purchase_return_id_fkey" FOREIGN KEY ("purchase_return_id") REFERENCES "public"."purchase_return"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_return_item" ADD CONSTRAINT "purchase_return_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_return_item" ADD CONSTRAINT "purchase_return_item_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_return_item" ADD CONSTRAINT "purchase_return_item_purchase_order_item_id_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "public"."purchase_order_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_return_payment" ADD CONSTRAINT "purchase_return_payment_purchase_return_id_fkey" FOREIGN KEY ("purchase_return_id") REFERENCES "public"."purchase_return"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."statistics_daily" ADD CONSTRAINT "statistics_daily_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_transaction" ADD CONSTRAINT "cash_transaction_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cash_book_entry" ADD CONSTRAINT "cash_book_entry_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProductToTag" ADD CONSTRAINT "_ProductToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProductToTag" ADD CONSTRAINT "_ProductToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CategoryToProduct" ADD CONSTRAINT "_CategoryToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
