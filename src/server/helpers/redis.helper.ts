import { redis } from '../services/redis.service';

export class RedisHelper {
  static async del(...keys: string[]): Promise<void> {
    for (const key of keys) {
      await redis.del(key);
    }
  }

  static async hDel(key: string, field: string): Promise<void> {
    // @ts-ignore - Devvit Redis API type definitions might be incorrect
    await redis.hDel(key, field);
  }

  static async hSetObject(key: string, obj: Record<string, string>): Promise<void> {
    // @ts-ignore - Devvit Redis API type definitions might be incorrect
    await redis.hSet(key, obj);
  }

  static async hSet(key: string, field: string, value: string): Promise<void> {
    // @ts-ignore - Devvit Redis API type definitions might be incorrect
    await redis.hSet(key, field, value);
  }
}