import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { VENDOR_IDENTIFIER_HMAC_SECRET, VENDOR_MODEL_NAME } from "./vendor.constants";
import { VendorController } from "./vendor.controller";
import { VendorService } from "./vendor.service";
import { vendorSchema } from "./vendor.schema";
import { MongooseVendorStore, VENDOR_STORE } from "./vendor.store";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: VENDOR_MODEL_NAME, schema: vendorSchema }]),
  ],
  controllers: [VendorController],
  providers: [
    VendorService,
    MongooseVendorStore,
    {
      provide: VENDOR_STORE,
      useExisting: MongooseVendorStore,
    },
    {
      provide: VENDOR_IDENTIFIER_HMAC_SECRET,
      useFactory: () => process.env,
    },
  ],
})
export class VendorsModule {}
