import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * ENTIDAD REVOKED TOKEN (BLACKLIST)
 * 
 * Almacena los tokens (access y refresh) que han sido revocados
 * antes de su expiración natural. Esto es necesario para logout
 * y para invalidar tokens comprometidos.
 * 
 * NOTA: Esta tabla debe limpiarse periódicamente eliminando
 * tokens cuya fecha de expiración ya pasó.
 */
@Entity('revoked_tokens')
@Index(['jti'], { unique: true })
@Index(['expiresAt'])
@Index(['tokenType'])
export class RevokedToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  jti: string; // JWT ID - identificador único del token

  @Column({ name: 'token_type', length: 20 })
  tokenType: 'access' | 'refresh';

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date; // Fecha de expiración original del token

  @Column({ name: 'revoked_reason', length: 255, nullable: true })
  revokedReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Verificar si este registro de revocación aún es necesario
   * (el token original ya habría expirado)
   */
  canBeCleanedUp(): boolean {
    return new Date() > this.expiresAt;
  }
}
