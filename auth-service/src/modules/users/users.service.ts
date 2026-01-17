import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Crear un nuevo usuario
   */
  async create(registerDto: RegisterDto): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const user = this.userRepository.create({
      email: registerDto.email.toLowerCase().trim(),
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      documentNumber: registerDto.documentNumber,
      role: registerDto.role,
    });

    return this.userRepository.save(user);
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  /**
   * Obtener usuario por ID o lanzar error
   */
  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  /**
   * Actualizar último login y resetear intentos fallidos
   */
  async recordSuccessfulLogin(user: User): Promise<void> {
    user.resetFailedAttempts();
    await this.userRepository.save(user);
  }

  /**
   * Registrar intento de login fallido
   */
  async recordFailedLogin(user: User): Promise<void> {
    user.incrementFailedAttempts();
    await this.userRepository.save(user);
  }

  /**
   * Verificar si el usuario puede hacer login
   */
  canLogin(user: User): { canLogin: boolean; reason?: string } {
    if (user.status === UserStatus.INACTIVE) {
      return { canLogin: false, reason: 'Cuenta inactiva' };
    }
    if (user.status === UserStatus.SUSPENDED) {
      return { canLogin: false, reason: 'Cuenta suspendida' };
    }
    if (user.isLocked()) {
      return { 
        canLogin: false, 
        reason: `Cuenta bloqueada temporalmente. Intenta de nuevo después de ${user.lockedUntil?.toLocaleTimeString()}` 
      };
    }
    return { canLogin: true };
  }

  /**
   * Listar todos los usuarios (para admin)
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Actualizar estado del usuario
   */
  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findByIdOrFail(id);
    user.status = status;
    return this.userRepository.save(user);
  }
}
