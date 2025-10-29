import Phaser from 'phaser';

const TILE_SIZE = 32;
const GROUND_CHECK_DISTANCE = TILE_SIZE / 2 + 5;

export function updateEnemyPatrol(
  enemies: Phaser.GameObjects.GameObject[],
  platforms: Phaser.GameObjects.GameObject[]
): void {
  if (!enemies || !platforms) return;

  enemies.forEach((enemy: any) => {
    if (!enemy.body || !enemy.active) return;

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const patrolLeft = enemy.getData('patrolLeft');
    const patrolRight = enemy.getData('patrolRight');
    const patrolSpeed = enemy.getData('patrolSpeed') || 30;
    let direction = enemy.getData('patrolDirection') || 1;

    if (patrolLeft === undefined || patrolRight === undefined) return;

    let shouldTurn = false;

    if (direction === 1 && enemy.x >= patrolRight) {
      shouldTurn = true;
    } else if (direction === -1 && enemy.x <= patrolLeft) {
      shouldTurn = true;
    }

    if (!shouldTurn && body.blocked.down) {
      const checkX = enemy.x + direction * GROUND_CHECK_DISTANCE;
      const checkY = enemy.y + TILE_SIZE;

      let hasValidGround = false;

      for (const platform of platforms) {
        const plat = platform as any;
        if (!plat.body) continue;

        const platBody = plat.body as Phaser.Physics.Arcade.StaticBody;
        const platLeft = platBody.x;
        const platRight = platBody.x + platBody.width;
        const platTop = platBody.y;
        const platBottom = platBody.y + platBody.height;

        const isDirtOrGrass =
          plat.texture?.key === 'grass' ||
          plat.texture?.key === 'ground' ||
          plat.texture?.key === 'grass-filler';

        if (!isDirtOrGrass) continue;

        if (
          checkX >= platLeft &&
          checkX <= platRight &&
          checkY >= platTop &&
          checkY <= platBottom
        ) {
          hasValidGround = true;
          break;
        }
      }

      if (!hasValidGround) {
        shouldTurn = true;
      }
    }

    if (shouldTurn) {
      direction *= -1;
      enemy.setData('patrolDirection', direction);
    }

    body.setVelocityX(direction * patrolSpeed);

    if (direction < 0) {
      enemy.setFlipX(true);
    } else {
      enemy.setFlipX(false);
    }
  });
}
