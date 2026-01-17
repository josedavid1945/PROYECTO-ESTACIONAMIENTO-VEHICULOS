import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para obtener el usuario actual del request
 * 
 * Uso:
 * @CurrentUser() user - obtiene todo el objeto usuario
 * @CurrentUser('id') userId - obtiene solo el campo 'id'
 * @CurrentUser('email') email - obtiene solo el campo 'email'
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
