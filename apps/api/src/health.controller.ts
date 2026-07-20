import { Controller, Get } from "@nestjs/common";

import { Public } from "./auth/public.decorator";

@Public()
@Controller()
export class HealthController {
  @Get("health")
  getHealth(): { status: "ok" } {
    return { status: "ok" };
  }
}
