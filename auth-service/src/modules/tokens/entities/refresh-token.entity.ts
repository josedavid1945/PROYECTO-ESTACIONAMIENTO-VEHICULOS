import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * ENTIDAD REFRESH TOKEN
 * 
 * Almacena los refresh tokens activos de los usuarios.
 * Permite manejar múltiples sesiones por usuario y revocar tokens específicos.
 */
@Entity('refresh_tokens')
@Index(['token'], { unique: true })
@Index(['userId'])
@Index(['expiresAt'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'device_info', type: 'text', nullable: true })
  deviceInfo?: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'revoked_reason', length: 255, nullable: true })
  revokedReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Verificar si el token ha expirado
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Verificar si el token es válido (no revocado y no expirado)
   */
  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  /**
   * Revocar el token
   */
  revoke(reason?: string): void {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedReason = reason;
  }
}
