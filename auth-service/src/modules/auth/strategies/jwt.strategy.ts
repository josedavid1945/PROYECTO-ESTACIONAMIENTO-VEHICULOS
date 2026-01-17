import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokensService, JwtPayload } from '../../tokens/tokens.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokensService: TokensService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Validar el payload del JWT
   * Este método se ejecuta después de que Passport verifica la firma y expiración
   */
  async validate(payload: JwtPayload): Promise<any> {
    // Verificar que es un access token (no refresh)
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Tipo de token inválido');
    }

    // Verificar si el token está en la blacklist
    const isRevoked = await this.tokensService.isTokenRevoked(payload.jti);
    if (isRevoked) {
      throw new UnauthorizedException('Token revocado');
    }

    // Obtener usuario y verificar que existe y está activo
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const canLoginResult = this.usersService.canLogin(user);
    if (!canLoginResult.canLogin) {
      throw new UnauthorizedException(canLoginResult.reason);
    }

    // Retornar datos del usuario para inyectar en el request
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}
