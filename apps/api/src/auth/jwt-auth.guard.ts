import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AUTH_CLOCK, AUTH_STORE, PUBLIC_ROUTE } from "./auth.constants";
import type { AuthStore } from "./auth.store";
import type { AuthClock, AuthenticatedRequest } from "./auth.types";
import { JwtTokenService } from "./jwt-token.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(JwtTokenService)
    private readonly tokens: JwtTokenService,
    @Inject(AUTH_STORE) private readonly store: AuthStore,
    @Inject(AUTH_CLOCK) private readonly clock: AuthClock,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Authentication required");
    }

    let userId: string;
    try {
      userId = this.tokens.verifyAccess(
        authorization.slice("Bearer ".length),
        this.clock.now(),
      ).sub;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    const user = await this.store.findById(userId);
    if (!user) throw new UnauthorizedException("Invalid access token subject");
    request.authUser = user;
    return true;
  }
}
