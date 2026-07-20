import { SetMetadata } from "@nestjs/common";

import { PUBLIC_ROUTE } from "./auth.constants";

export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(PUBLIC_ROUTE, true);
