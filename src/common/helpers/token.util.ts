// utils/jwt.util.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h', // dùng trực tiếp cho jwt.sign()
};

export const jwtRefreshConfig = {
  secret: process.env.JWT_REFRESH_SECRET!,
  expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // dùng trực tiếp cho jwt.sign()
};

// convert sang ms để set cookie
export function getCookieMaxAge(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/); // s, m, h, d
  if (!match) throw new Error(`Invalid expiresIn format: ${expiresIn}`);

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid expiresIn unit: ${unit}`);
  }
}
