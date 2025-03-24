import bcrypt from 'bcryptjs';
import jwt, { verify } from 'jsonwebtoken';
import { prisma } from './prisma';
import { User } from '@prisma/client';

// Get the JWT secret from environment variables with fallback
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: JWT_SECRET is not set in production environment');
  }
  return secret || 'fallback-secret-do-not-use-in-production';
}

// Generate a random string for use as a token
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = chars.length;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Compare a password with a hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate JWT tokens
export function generateTokens(user: User) {
  const JWT_SECRET = getJwtSecret();
  
  // Create access token (short-lived)
  const accessToken = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
  
  // Create refresh token (long-lived)
  const refreshToken = generateRandomString(64);
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
  
  // Calculate expiry date
  const expiresInMs = expiresIn.endsWith('d') 
    ? parseInt(expiresIn) * 24 * 60 * 60 * 1000 
    : parseInt(expiresIn) * 60 * 1000;
  
  const expiresAt = new Date(Date.now() + expiresInMs);
  
  return {
    accessToken,
    refreshToken,
    expiresAt
  };
}

interface DecodedToken {
  userId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export function verifyToken(token: string): DecodedToken | string {
  try {
    // Verify the token using the secret key
    const decoded = verify(token, getJwtSecret());
    return decoded as DecodedToken;
  } catch (error) {
    // If verification fails, return the error message
    return error instanceof Error ? error.message : 'Token verification failed';
  }
}

// Store refresh token in database
export async function storeRefreshToken(userId: string, token: string, expiresAt: Date) {
  return prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });
}

// Verify refresh token
export async function verifyRefreshToken(token: string) {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token }
  });
  
  if (!refreshToken) return null;
  
  // Check if token is expired
  if (refreshToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.refreshToken.delete({
      where: { id: refreshToken.id }
    });
    
    return null;
  }
  
  // Get user associated with token
  const user = await prisma.user.findUnique({
    where: { id: refreshToken.userId }
  });
  
  return user;
}

// Invalidate refresh token
export async function invalidateRefreshToken(token: string) {
  return prisma.refreshToken.delete({
    where: { token }
  });
} 