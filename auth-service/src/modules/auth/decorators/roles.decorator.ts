import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Decorador para restringir endpoints a roles específicos
 * 
 * Uso:
 * @Roles(UserRole.ADMIN) - solo admins
 * @Roles(UserRole.ADMIN, UserRole.OPERATOR) - admins y operadores
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
