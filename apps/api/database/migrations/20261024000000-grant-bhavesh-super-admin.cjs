const TARGET_EMAIL = "bhavesh.ai@eqourse.com";
const ROLE = "SUPER_ADMIN";
const BUSINESS_UNIT = "EQOURSE";
const ACTOR = "migration:FR-ADM-07-01";
const REASON =
  "Grant SUPER_ADMIN to run the FR-FND-06 observability checks; approval: Bhavesh, 24 October 2026, requested in writing in order to complete FR-FND-06 acceptance.";

async function withTransaction(client, callback) {
  const session = client.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  async up(db, client) {
    return withTransaction(client, async (session) => {
      const users = db.collection("users");
      const auditLogs = db.collection("auditLogs");
      const user = await users.findOne({ email: TARGET_EMAIL }, { session });

      if (!user) {
        throw new Error(`Internal role subject ${TARGET_EMAIL} does not exist`);
      }

      const assignments = user.roleAssignments ?? [];
      const existingSuperAdmins = assignments.filter((assignment) => assignment.role === ROLE);
      const exactAssignment = existingSuperAdmins.find(
        (assignment) => assignment.businessUnit === BUSINESS_UNIT,
      );

      if (existingSuperAdmins.length > 0 && !exactAssignment) {
        throw new Error(
          `Subject ${TARGET_EMAIL} already has SUPER_ADMIN with a non-canonical business unit`,
        );
      }

      if (exactAssignment) return;

      const now = new Date();
      const assignment = { role: ROLE, businessUnit: BUSINESS_UNIT };
      await users.updateOne(
        { _id: user._id },
        {
          $addToSet: { roleAssignments: assignment },
          $set: { "refreshSessions.$[].revokedAt": now },
        },
        { session },
      );
      await auditLogs.insertOne(
        {
          actorUserId: user._id,
          actor: ACTOR,
          subjectCollection: "users",
          subjectId: user._id,
          subjectEmail: TARGET_EMAIL,
          role: ROLE,
          businessUnit: BUSINESS_UNIT,
          fromState: "UNASSIGNED",
          toState: ROLE,
          reason: REASON,
          occurredAt: now,
        },
        { session },
      );
    });
  },

  async down(db, client) {
    return withTransaction(client, async (session) => {
      await db.collection("users").updateOne(
        {
          email: TARGET_EMAIL,
          roleAssignments: { $elemMatch: { role: ROLE, businessUnit: BUSINESS_UNIT } },
        },
        { $pull: { roleAssignments: { role: ROLE, businessUnit: BUSINESS_UNIT } } },
        { session },
      );
    });
  },
};
