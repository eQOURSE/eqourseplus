import { Module } from "@nestjs/common";
import { PROFILE_STORE } from "./profile.constants";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { MongooseProfileStore } from "./profile.store";

@Module({
  controllers: [ProfileController],
  providers: [
    ProfileService,
    MongooseProfileStore,
    { provide: PROFILE_STORE, useExisting: MongooseProfileStore },
  ],
  exports: [PROFILE_STORE],
})
export class ProfilesModule {}
