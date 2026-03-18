import {
  PrismaClient,
  user_role,
  user_status,
  provider_type,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];

  if (!email || !password) {
    console.error('Usage: ts-node scripts/seed-admin.ts <email> <password>');
    process.exit(1);
  }

  console.log(`Creating super admin with email: ${email}`);

  const hashedPassword = await bcrypt.hash(password, 10);
  const username = email.split('@')[0];

  /**
   * Refactored for current schema:
   * - User model has email, password, username, role, status, provider.
   * - No UserAuthAccount or AdminUser models exist.
   * - enums are lowercase (user_role, user_status, provider_type).
   */
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: user_role.ADMIN,
      status: user_status.ACTIVE,
      password: hashedPassword,
      provider: provider_type.MANUAL,
    },
    create: {
      email,
      username,
      password: hashedPassword,
      role: user_role.ADMIN,
      status: user_status.ACTIVE,
      provider: provider_type.MANUAL,
      is_verified: true,
    },
  });

  console.log(
    `✅ Super Admin created successfully: ${email} (Username: ${username})`,
  );
  console.log(`User ID: ${user.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
