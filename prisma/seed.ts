import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data in correct order (respecting foreign key constraints)
  await prisma.statisticsDaily.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.storeMember.deleteMany();
  await prisma.category.deleteMany();
  await prisma.store.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleared existing data');

  // Create sample users with different roles
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        password: '$2b$10$hashedpassword', // In real app, use proper hashing
        role: 'ADMIN',
        status: 'ACTIVE',
        is_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'owner@example.com',
        username: 'store_owner',
        password: '$2b$10$hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
        is_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'staff@example.com',
        username: 'cashier',
        password: '$2b$10$hashedpassword',
        role: 'STAFF',
        status: 'ACTIVE',
        is_verified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'member@example.com',
        username: 'member',
        password: '$2b$10$hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
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
        name: 'New',
        description: 'New products',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Bestseller',
        description: 'Best selling products',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Discounted',
        description: 'Products on sale',
      },
    }),
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        store_id: store.id,
        name: 'iPhone 15 Pro',
        sku: 'IPH15P-128',
        barcode: '123456789012',
        price: 99900, // $999.00 in cents
        cost: 80000, // $800.00 in cents
        image_url: 'https://example.com/iphone15.jpg',
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
      },
    }),
    prisma.product.create({
      data: {
        store_id: store.id,
        name: 'MacBook Pro 16"',
        sku: 'MBP16-M3',
        barcode: '123456789013',
        price: 249900, // $2499.00 in cents
        cost: 200000, // $2000.00 in cents
        image_url: 'https://example.com/macbook.jpg',
        description: 'Powerful laptop for professionals',
        created_by: users[1].id,
        categories: {
          connect: [{ id: categories[1].id }], // Laptops
        },
        tags: {
          connect: [{ id: tags[0].id }], // New
        },
      },
    }),
    prisma.product.create({
      data: {
        store_id: store.id,
        name: 'iPhone Charger',
        sku: 'IPH-CHGR-20W',
        barcode: '123456789014',
        price: 2500, // $25.00 in cents
        cost: 1500, // $15.00 in cents
        description: '20W USB-C charger for iPhone',
        created_by: users[1].id,
        categories: {
          connect: [{ id: categories[2].id }], // Accessories
        },
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Create inventory for products
  const inventories = await Promise.all([
    prisma.inventory.create({
      data: {
        product_id: products[0].id, // iPhone 15 Pro
        quantity: 50,
        discount: 0,
        total: 50,
      },
    }),
    prisma.inventory.create({
      data: {
        product_id: products[1].id, // MacBook Pro
        quantity: 10,
        discount: 0,
        total: 10,
      },
    }),
    prisma.inventory.create({
      data: {
        product_id: products[2].id, // iPhone Charger
        quantity: 100,
        discount: 0,
        total: 100,
      },
    }),
  ]);

  console.log(`✅ Created inventory for ${inventories.length} products`);

  // Create stock movements
  const stockMovements = await Promise.all([
    prisma.stockMovement.create({
      data: {
        product_id: products[0].id,
        quantity: 50,
        type: 'PURCHASE',
      },
    }),
    prisma.stockMovement.create({
      data: {
        product_id: products[1].id,
        quantity: 10,
        type: 'PURCHASE',
      },
    }),
    prisma.stockMovement.create({
      data: {
        product_id: products[2].id,
        quantity: 100,
        type: 'PURCHASE',
      },
    }),
  ]);

  console.log(`✅ Created ${stockMovements.length} stock movements`);

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
        cashier_id: users[2].id, // staff/cashier
        customer_id: customers[0].id,
        customer_name: 'John Doe',
        subtotal_amount: 99900, // $999.00
        discount_amount: 0,
        tax_amount: 9990, // $99.90 (10% tax)
        total_amount: 109890, // $1098.90
        payment_method: 'CREDIT_CARD',
        status: 'COMPLETED',
      },
    }),
    prisma.order.create({
      data: {
        code: 'ORD-002',
        cashier_id: users[2].id,
        customer_id: customers[1].id,
        customer_name: 'Jane Smith',
        subtotal_amount: 2500, // $25.00
        discount_amount: 0,
        tax_amount: 250, // $2.50 (10% tax)
        total_amount: 2750, // $27.50
        payment_method: 'CASH',
        status: 'COMPLETED',
      },
    }),
    prisma.order.create({
      data: {
        code: 'ORD-003',
        cashier_id: users[2].id,
        subtotal_amount: 249900, // $2499.00
        discount_amount: 24990, // $249.90 (10% discount)
        tax_amount: 22491, // $224.91 (10% tax on discounted amount)
        total_amount: 247401, // $2474.01
        payment_method: 'DEBIT_CARD',
        status: 'COMPLETED',
      },
    }),
  ]);

  console.log(`✅ Created ${orders.length} orders`);

  // Create order items
  const orderItems = await Promise.all([
    prisma.orderItem.create({
      data: {
        order_id: orders[0].id,
        product_id: products[0].id,
        quantity: 1,
        price: 99900, // $999.00
      },
    }),
    prisma.orderItem.create({
      data: {
        order_id: orders[1].id,
        product_id: products[2].id,
        quantity: 1,
        price: 2500, // $25.00
      },
    }),
    prisma.orderItem.create({
      data: {
        order_id: orders[2].id,
        product_id: products[1].id,
        quantity: 1,
        price: 249900, // $2499.00
      },
    }),
  ]);

  console.log(`✅ Created ${orderItems.length} order items`);

  // Update inventory after sales (simulate stock reduction)
  await Promise.all([
    prisma.inventory.update({
      where: { id: inventories[0].id },
      data: { quantity: 49 }, // iPhone: 50 - 1 = 49
    }),
    prisma.inventory.update({
      where: { id: inventories[2].id },
      data: { quantity: 99 }, // Charger: 100 - 1 = 99
    }),
    prisma.inventory.update({
      where: { id: inventories[1].id },
      data: { quantity: 9 }, // MacBook: 10 - 1 = 9
    }),
  ]);

  // Create additional stock movements for sales
  await Promise.all([
    prisma.stockMovement.create({
      data: {
        product_id: products[0].id,
        quantity: -1, // Sale
        type: 'SALE',
      },
    }),
    prisma.stockMovement.create({
      data: {
        product_id: products[2].id,
        quantity: -1, // Sale
        type: 'SALE',
      },
    }),
    prisma.stockMovement.create({
      data: {
        product_id: products[1].id,
        quantity: -1, // Sale
        type: 'SALE',
      },
    }),
  ]);

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
      stock_in_units: 158, // Current total inventory
      stock_out_units: 3,
      stock_net_units: 155,
      product_created: 3,
      active_product: 3,
    },
  });

  console.log(`✅ Created daily statistics`);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: ${users.length}`);
  console.log(`   Stores: 1`);
  console.log(`   Store Members: ${storeMembers.length}`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Tags: ${tags.length}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Orders: ${orders.length}`);
  console.log(`   Order Items: ${orderItems.length}`);
  console.log(`   Stock Movements: ${stockMovements.length + 3}`); // +3 for sales
  console.log(`   Daily Statistics: 1`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
