import {
  PrismaClient,
  user_role,
  user_status,
  provider_type,
  stock_movement_type,
  payment_method,
  order_status,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data in correct order (respecting foreign key constraints)
  await prisma.statisticsDaily.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.variantStock.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.storeMember.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleared existing data');

  // Create sample users with different roles
  // Use user_role and user_status enums from prisma client
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        password: '$2b$10$hashedpassword', // In real app, use proper hashing
        role: user_role.ADMIN,
        status: user_status.ACTIVE,
        is_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'owner@example.com',
        username: 'store_owner',
        password: '$2b$10$hashedpassword',
        role: user_role.USER,
        status: user_status.ACTIVE,
        is_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'staff@example.com',
        username: 'cashier',
        password: '$2b$10$hashedpassword',
        role: user_role.STAFF,
        status: user_status.ACTIVE,
        is_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'member@example.com',
        username: 'member',
        password: '$2b$10$hashedpassword',
        role: user_role.USER,
        status: user_status.ACTIVE,
        is_verified: true,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create a store owned by the owner user
  const store = await prisma.store.create({
    data: {
      name: 'Tech Store',
      description: 'Your one-stop shop for electronics',
      owner_id: users[1].id, // store_owner
    },
  });

  console.log(`✅ Created store: ${store.name}`);

  // Add store members
  const storeMembers = await Promise.all([
    prisma.storeMember.create({
      data: {
        storeId: store.id,
        userId: users[2].id, // staff/cashier
        role: 'MEMBER',
      },
    }),
    prisma.storeMember.create({
      data: {
        storeId: store.id,
        userId: users[3].id, // member
        role: 'MEMBER',
      },
    }),
  ]);

  console.log(`✅ Added ${storeMembers.length} store members`);

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        store_id: store.id,
        name: 'Smartphones',
        description: 'Mobile phones and accessories',
      },
    }),
    prisma.category.create({
      data: {
        store_id: store.id,
        name: 'Laptops',
        description: 'Portable computers',
      },
    }),
    prisma.category.create({
      data: {
        store_id: store.id,
        name: 'Accessories',
        description: 'Phone cases, chargers, etc.',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        store_id: store.id,
        name: 'New',
        description: 'New products',
      },
    }),
    prisma.tag.create({
      data: {
        store_id: store.id,
        name: 'Bestseller',
        description: 'Best selling products',
      },
    }),
    prisma.tag.create({
      data: {
        store_id: store.id,
        name: 'Discounted',
        description: 'Products on sale',
      },
    }),
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // Create products and variants
  // In the current schema, SKU, price, and cost are in Variant model
  const products = await Promise.all([
    prisma.product.create({
      data: {
        store_id: store.id,
        name: 'iPhone 15 Pro',
        sku: 'IPH15P',
        baseUnit: 'Unit',
        description: 'Latest iPhone with advanced features',
        created_by: users[1].id, // store_owner
        categories: {
          connect: [{ id: categories[0].id }], // Smartphones
        },
        tags: {
          connect: [
            { id: tags[0].id }, // New
            { id: tags[1].id }, // Bestseller
          ],
        },
        variant: {
          create: {
            sku: 'IPH15P-128',
            name: 'Standard',
            price: 99900, // $999.00 in cents
            cost: 80000, // $800.00 in cents
          },
        },
      },
      include: { variant: true },
    }),
    prisma.product.create({
      data: {
        store_id: store.id,
        name: 'MacBook Pro 16"',
        sku: 'MBP16',
        baseUnit: 'Unit',
        description: 'Powerful laptop for professionals',
        created_by: users[1].id,
        categories: {
          connect: [{ id: categories[1].id }], // Laptops
        },
        tags: {
          connect: [{ id: tags[0].id }], // New
        },
        variant: {
          create: {
            sku: 'MBP16-M3',
            name: 'M3 Pro',
            price: 249900, // $2499.00 in cents
            cost: 200000, // $2000.00 in cents
          },
        },
      },
      include: { variant: true },
    }),
    prisma.product.create({
      data: {
        store_id: store.id,
        name: 'iPhone Charger',
        sku: 'IPH-CHGR',
        baseUnit: 'Unit',
        description: '20W USB-C charger for iPhone',
        created_by: users[1].id,
        categories: {
          connect: [{ id: categories[2].id }], // Accessories
        },
        variant: {
          create: {
            sku: 'IPH-CHGR-20W',
            name: 'Standard',
            price: 2500, // $25.00 in cents
            cost: 1500, // $15.00 in cents
          },
        },
      },
      include: { variant: true },
    }),
  ]);

  console.log(`✅ Created ${products.length} products with variants`);

  // Create initial stock (VariantStock)
  const variantStocks = await Promise.all(
    products.map((p) =>
      prisma.variantStock.create({
        data: {
          store_id: store.id,
          variant_id: p.variant[0].id,
          onHand: p.name.includes('iPhone 15')
            ? 50
            : p.name.includes('MacBook')
              ? 10
              : 100,
        },
      }),
    ),
  );

  console.log(`✅ Created stock for ${variantStocks.length} variants`);

  // Create initial stock movements
  const stockMovements = await Promise.all(
    products.map((p) =>
      prisma.stockMovement.create({
        data: {
          variant_id: p.variant[0].id,
          quantity: p.name.includes('iPhone 15')
            ? 50
            : p.name.includes('MacBook')
              ? 10
              : 100,
          type: stock_movement_type.PURCHASE,
        },
      }),
    ),
  );

  console.log(`✅ Created ${stockMovements.length} initial stock movements`);

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        store_id: store.id,
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA',
      },
    }),
    prisma.customer.create({
      data: {
        store_id: store.id,
        name: 'Jane Smith',
        phone: '+0987654321',
        email: 'jane@example.com',
        address: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90210',
        country: 'USA',
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // Create orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        code: 'ORD-001',
        store_id: store.id,
        cashier_id: users[2].id, // staff/cashier
        customer_id: customers[0].id,
        customer_name: 'John Doe',
        subtotal_amount: 99900, // $999.00
        discount_amount: 0,
        tax_amount: 9990, // $99.90 (10% tax)
        total_amount: 109890, // $1098.90
        payment_method: payment_method.CREDIT_CARD,
        status: order_status.COMPLETED,
        order_item: {
          create: {
            product_id: products[0].id,
            variant_id: products[0].variant[0].id,
            quantity: 1,
            price: 99900,
            total: 99900,
          },
        },
      },
    }),
    prisma.order.create({
      data: {
        code: 'ORD-002',
        store_id: store.id,
        cashier_id: users[2].id,
        customer_id: customers[1].id,
        customer_name: 'Jane Smith',
        subtotal_amount: 2500, // $25.00
        discount_amount: 0,
        tax_amount: 250, // $2.50 (10% tax)
        total_amount: 2750, // $27.50
        payment_method: payment_method.CASH,
        status: order_status.COMPLETED,
        order_item: {
          create: {
            product_id: products[2].id,
            variant_id: products[2].variant[0].id,
            quantity: 1,
            price: 2500,
            total: 2500,
          },
        },
      },
    }),
    prisma.order.create({
      data: {
        code: 'ORD-003',
        store_id: store.id,
        cashier_id: users[2].id,
        subtotal_amount: 249900, // $2499.00
        discount_amount: 24990, // $249.90 (10% discount)
        tax_amount: 22491, // $224.91 (10% tax on discounted amount)
        total_amount: 247401, // $2474.01
        payment_method: payment_method.DEBIT_CARD,
        status: order_status.COMPLETED,
        order_item: {
          create: {
            product_id: products[1].id,
            variant_id: products[1].variant[0].id,
            quantity: 1,
            price: 249900,
            total: 249900,
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${orders.length} orders with items`);

  // Update stock movements for sales
  await Promise.all(
    orders.map(async (order) => {
      // Since we combined order item creation, this part just records the movement
      // In a real app, this would be handled by a service
      const item = await prisma.orderItem.findFirst({
        where: { order_id: order.id },
      });
      if (item) {
        await prisma.stockMovement.create({
          data: {
            variant_id: item.variant_id,
            quantity: -item.quantity,
            type: stock_movement_type.SALE,
          },
        });

        await prisma.variantStock.update({
          where: {
            variant_id_store_id: {
              variant_id: item.variant_id,
              store_id: store.id,
            },
          },
          data: {
            onHand: { decrement: item.quantity },
          },
        });
      }
    }),
  );

  console.log(
    `✅ Recorded sales in stock movements and updated on-hand quantities`,
  );

  // Create daily statistics
  const today = new Date();
  const dailyStats = await prisma.statisticsDaily.create({
    data: {
      store_id: store.id,
      stat_date: today,
      orders_count: 3,
      paid_orders_count: 3,
      cancelled_orders_count: 0,
      refunded_orders_count: 0,
      gross_revenue: 357300, // $3573.00 (sum of subtotals)
      discounts_total: 24990, // $249.90
      tax_total: 34731, // $347.31
      net_revenue: 358041, // $3580.41
      units_sold: 3,
      units_returned: 0,
      stock_in_units: 158, // Initial total
      stock_out_units: 3,
      stock_net_units: 155,
      product_created: 3,
      active_product: 3,
    },
  });

  console.log(`✅ Created daily statistics`);

  console.log('🎉 Seed completed successfully!');
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
