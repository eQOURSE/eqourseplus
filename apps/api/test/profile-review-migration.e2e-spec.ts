import { describe, expect, it, vi } from "vitest";

import migration from "../database/migrations/20261013000000-add-profile-review-queue.cjs";

describe("FR-REG-07 profile review queue migration", () => {
  it("uses index names in the rollback path and restores the previous index", async () => {
    const dropIndex = vi.fn().mockResolvedValue(undefined);
    const createIndex = vi.fn().mockResolvedValue(undefined);
    const updateMany = vi.fn().mockResolvedValue(undefined);
    const listIndexes = vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([
      { name: "state_1_updatedAt_1" },
      { name: "state_1_submittedAt_1" },
    ]) });
    const collection = vi.fn().mockReturnValue({ dropIndex, createIndex, listIndexes, updateMany });
    const db = {
      listCollections: vi.fn().mockReturnValue({ next: vi.fn().mockResolvedValue({ options: { validator: { $jsonSchema: { properties: {} } } } }) }),
      collection,
      command: vi.fn().mockResolvedValue(undefined),
    };
    await migration.down(db);
    expect(dropIndex).toHaveBeenCalledWith("state_1_submittedAt_1");
    expect(createIndex).toHaveBeenCalledWith({ state: 1, updatedAt: 1 });
    expect(updateMany).toHaveBeenCalledWith(
      { submittedAt: { $exists: true } },
      { $unset: { submittedAt: "" } },
    );
  });

  it("adds the validator field before backfilling strict legacy documents", async () => {
    const updateMany = vi.fn().mockResolvedValue(undefined);
    const command = vi.fn().mockResolvedValue(undefined);
    const collection = vi.fn().mockReturnValue({
      updateMany,
      createIndex: vi.fn().mockResolvedValue(undefined),
      dropIndex: vi.fn().mockResolvedValue(undefined),
      listIndexes: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
    });
    const db = {
      listCollections: vi.fn().mockReturnValue({ next: vi.fn().mockResolvedValue({ options: { validator: { $jsonSchema: { additionalProperties: false, properties: {} } } } }) }),
      collection,
      command,
    };
    await migration.up(db);
    expect(command.mock.invocationCallOrder[0]).toBeLessThan(updateMany.mock.invocationCallOrder[0]);
    expect(updateMany).toHaveBeenCalledWith(
      { state: { $in: ["SUBMITTED", "UNDER_REVIEW"] }, submittedAt: { $exists: false } },
      [{ $set: { submittedAt: { $ifNull: ["$updatedAt", "$createdAt"] } } }],
    );
  });
});
