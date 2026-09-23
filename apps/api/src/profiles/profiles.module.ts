import { Module } from "@nestjs/common";
import { createStorageAdapter } from "../company-registration/r2-storage.adapter";
import { PROFILE_STORE } from "./profile.constants";
import { PROFILE_STORAGE_ADAPTER } from "./profile.constants";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";
import { MongooseProfileStore } from "./profile.store";

@Module({
  controllers: [ProfileController],
  providers: [
    ProfileService,
    MongooseProfileStore,
    { provide: PROFILE_STORE, useExisting: MongooseProfileStore },
    {
      provide: PROFILE_STORAGE_ADAPTER,
      useFactory: () => createStorageAdapter(process.env),
    },
  ],
  exports: [PROFILE_STORE],
})
export class ProfilesModule {}
