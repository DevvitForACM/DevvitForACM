import Phaser from 'phaser';
import { audioManager } from '@/services/audio-manager';
import { GAMEPLAY, ENTITY_CONFIG, SPRING } from '@/constants/game-constants';

export function setupCollisions(
  scene: Phaser.Scene,
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  onSpikeHit: () => void,
  onLavaHit: () => void,
  onEnemyHit: () => void,
  onSpringHit: (_p: any, spring: any) => void,
  onCoinHit: (_p: any, coin: any) => void,
  onPlatformCollide: (platform: Phaser.GameObjects.GameObject) => void
): {
  platforms: Phaser.GameObjects.GameObject[];
  enemies: Phaser.GameObjects.GameObject[];
  doors: Phaser.GameObjects.GameObject[];
} {
  const platforms = scene.children.list.filter((child: any) => {
    const isPlatform =
      typeof child?.getData === 'function' && child.getData('isPlatform');
    const isHazard =
      typeof child?.getData === 'function' &&
      (child.getData('isSpike') ||
        child.getData('isSpring') ||
        child.getData('isLava') ||
        child.getData('isEnemy'));
    const hasBody = !!(child as any)?.body;
    return hasBody && isPlatform && !isHazard;
  }) as Phaser.GameObjects.GameObject[];

  if (platforms.length > 0) {
    platforms.forEach((platform) => {
      scene.physics.add.collider(
        player,
        platform,
        (_p: any, plat: any) => onPlatformCollide(plat as any),
        undefined,
        scene
      );
    });
  } else {
    console.warn('[setupCollisions] No platforms found!');
  }

  const spikes = scene.children.list.filter((c: any) => {
    const tagged = typeof c?.getData === 'function' && c.getData('isSpike');
    const tex = (c as any)?.texture?.key;
    const name = (c as any)?.name ?? '';
    return tagged || tex === 'spike' || /spike/i.test(name);
  }) as Phaser.GameObjects.GameObject[];

  const springs = scene.children.list.filter((c: any) => {
    const tagged = typeof c?.getData === 'function' && c.getData('isSpring');
    const tex = (c as any)?.texture?.key;
    const name = (c as any)?.name ?? '';
    return tagged || tex === 'spring' || /spring/i.test(name);
  }) as Phaser.GameObjects.GameObject[];

  const lavas = scene.children.list.filter((c: any) => {
    const tagged = typeof c?.getData === 'function' && c.getData('isLava');
    const tex = (c as any)?.texture?.key;
    const name = (c as any)?.name ?? '';
    return tagged || tex === 'lava' || /lava/i.test(name);
  }) as Phaser.GameObjects.GameObject[];

  const coins = scene.children.list.filter((c: any) => {
    const tagged = typeof c?.getData === 'function' && c.getData('isCoin');
    const tex = (c as any)?.texture?.key;
    const name = (c as any)?.name ?? '';
    return tagged || tex === 'coin' || /coin/i.test(name);
  }) as Phaser.GameObjects.GameObject[];

  const doors = scene.children.list.filter((c: any) => {
    const tagged = typeof c?.getData === 'function' && c.getData('isDoor');
    const tex = (c as any)?.texture?.key;
    const name = (c as any)?.name ?? '';
    return tagged || tex === 'door' || /door/i.test(name);
  }) as Phaser.GameObjects.GameObject[];

  const enemies = scene.children.list.filter((c: any) => {
    const tagged = typeof c?.getData === 'function' && c.getData('isEnemy');
    const tex = (c as any)?.texture?.key;
    const name = (c as any)?.name ?? '';
    return tagged || /enemy/i.test(tex) || /enemy/i.test(name);
  }) as Phaser.GameObjects.GameObject[];

  spikes.forEach((spike) => {
    scene.physics.add.overlap(player, spike, onSpikeHit, undefined, scene);
  });
  springs.forEach((spring) => {
    scene.physics.add.overlap(player, spring, onSpringHit, undefined, scene);
  });
  lavas.forEach((lava) => {
    scene.physics.add.overlap(player, lava, onLavaHit, undefined, scene);
  });
  coins.forEach((coin) => {
    scene.physics.add.overlap(player, coin, onCoinHit, undefined, scene);
  });

  // Note: doors are NOT collidable - player must press jump to finish
  // Doors are returned so the scene can check distance for interaction

  enemies.forEach((enemy) => {
    platforms.forEach((platform) => {
      scene.physics.add.collider(enemy, platform);
    });
    scene.physics.add.overlap(player, enemy, onEnemyHit, undefined, scene);
  });

  return { platforms, enemies, doors };
}

export function handlePlatformCollision(
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  playerBody: Phaser.Physics.Arcade.Body,
  platform: Phaser.GameObjects.GameObject,
  lastSafePos: { x: number; y: number } | null
): { x: number; y: number } | null {
  const platAny: any = platform as any;
  const body: any = platAny.body;

  const playerBottom = playerBody.bottom;
  let platformTop: number;

  if (body && typeof body.top === 'number') {
    platformTop = body.top;
  } else {
    const ph = platAny.displayHeight ?? platAny.height ?? 0;
    const py = platAny.y ?? player.y;
    platformTop = py - ph / 2;
  }

  if (playerBody.blocked.down && playerBottom <= platformTop + 5) {
    const playerHalfH = (player.displayHeight ?? 32) / 2;
    const safeY = platformTop - playerHalfH - 1;
    const newSafePos = { x: player.x, y: safeY };
    try {
      localStorage.setItem('lastSafePos', JSON.stringify(newSafePos));
    } catch {}
    return newSafePos;
  }

  return lastSafePos;
}

export function handleSpringCollision(
  scene: Phaser.Scene,
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  playerBody: Phaser.Physics.Arcade.Body,
  spring: any,
  springCooldownUntil: number,
  springCooldownMs: number
): { cooldownUntil: number; safePos: { x: number; y: number } } {
  const now = scene.time.now;
  if (now < springCooldownUntil) {
    return {
      cooldownUntil: springCooldownUntil,
      safePos: { x: player.x, y: player.y },
    };
  }

  audioManager.playSpring();

  const body: any = spring?.body;
  const top =
    typeof body?.top === 'number'
      ? body.top
      : spring.y - (spring.displayHeight ?? spring.height ?? 24) / 2;
  const halfH = (player.displayHeight ?? 32) / 2;
  player.setY(top - halfH - 1);

  const g = GAMEPLAY.GRAVITY;
  const height = ENTITY_CONFIG.PLATFORM_HEIGHT * 3;
  const neededV = Math.sqrt(2 * g * height);
  const v = Math.min(neededV, SPRING.BOUNCE_FORCE * 2);
  playerBody.setVelocityY(-v);

  return {
    cooldownUntil: now + springCooldownMs,
    safePos: { x: player.x, y: player.y },
  };
}

export function handleCoinCollision(scene: Phaser.Scene, coin: any): void {
  if (!coin || !coin.active) return;
  audioManager.playCoin();

  scene.tweens.add({
    targets: coin,
    alpha: 0,
    scale: 1.5,
    duration: 200,
    ease: 'Power2',
    onComplete: () => {
      coin.destroy();
    },
  });
}
