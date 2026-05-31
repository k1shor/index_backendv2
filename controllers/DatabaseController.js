const mongoose = require("mongoose");
const { EJSON } = require("bson");

const BACKUP_VERSION = 1;

const getDatabase = () => {
  if (!mongoose.connection.db) {
    throw new Error("Database connection is not ready.");
  }

  return mongoose.connection.db;
};

const isValidCollectionName = (name) =>
  typeof name === "string" &&
  /^[a-zA-Z0-9_.-]+$/.test(name) &&
  !name.startsWith("system.");

const getRestoreFile = (req) =>
  req.file ||
  req.files?.backup?.[0] ||
  req.files?.file?.[0];

const getBackupPayload = (req) => {
  const restoreFile = getRestoreFile(req);

  if (restoreFile) {
    return EJSON.parse(restoreFile.buffer.toString("utf8"));
  }

  if (typeof req.body.backup === "string") {
    return EJSON.parse(req.body.backup);
  }

  if (req.body.backup && typeof req.body.backup === "object") {
    return EJSON.deserialize(req.body.backup);
  }

  if (req.body.collections && typeof req.body.collections === "object") {
    return EJSON.deserialize(req.body);
  }

  return null;
};

const getCollectionEntries = (backupPayload) => {
  if (!backupPayload || typeof backupPayload !== "object") {
    throw new Error("Backup file is missing or invalid.");
  }

  const collections = backupPayload.collections;

  if (!collections || typeof collections !== "object" || Array.isArray(collections)) {
    throw new Error("Backup file must include a collections object.");
  }

  const entries = Object.entries(collections).filter(([name]) =>
    isValidCollectionName(name)
  );

  if (!entries.length) {
    throw new Error("Backup file does not contain any supported collections.");
  }

  for (const [name, documents] of entries) {
    if (!Array.isArray(documents)) {
      throw new Error(`Collection "${name}" must be an array.`);
    }
  }

  return entries;
};

const getSummary = (entries) =>
  entries.reduce((summary, [name, documents]) => {
    summary[name] = documents.length;
    return summary;
  }, {});

const isTruthy = (value) => value === true || value === "true" || value === "1";

exports.createDatabaseBackup = async (req, res) => {
  try {
    const db = getDatabase();
    const collectionInfos = await db.listCollections().toArray();
    const collectionNames = collectionInfos
      .map((collection) => collection.name)
      .filter(isValidCollectionName)
      .sort();

    const collections = {};

    for (const collectionName of collectionNames) {
      collections[collectionName] = await db
        .collection(collectionName)
        .find({})
        .toArray();
    }

    const backup = {
      app: "indexithub-backend",
      version: BACKUP_VERSION,
      generatedAt: new Date(),
      generatedBy: req.user?._id || null,
      collections,
      summary: getSummary(Object.entries(collections)),
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `indexithub-backup-${timestamp}.json`;

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(EJSON.stringify(backup, null, 2, { relaxed: false }));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.restoreDatabaseBackup = async (req, res) => {
  try {
    const backupPayload = getBackupPayload(req);
    const collectionEntries = getCollectionEntries(backupPayload);
    const summary = getSummary(collectionEntries);

    const dryRun = isTruthy(req.body.dryRun) || isTruthy(req.query.dryRun);
    if (dryRun) {
      return res.json({
        message: "Backup file is valid.",
        summary,
      });
    }

    const confirmed =
      isTruthy(req.body.confirmRestore) ||
      isTruthy(req.body.confirm) ||
      isTruthy(req.query.confirmRestore) ||
      isTruthy(req.headers["x-confirm-restore"]);

    if (!confirmed) {
      return res.status(400).json({
        error: "Restore requires confirmRestore=true because it replaces collection data.",
        summary,
      });
    }

    const db = getDatabase();
    const restoredCollections = {};

    for (const [collectionName, documents] of collectionEntries) {
      const collection = db.collection(collectionName);
      await collection.deleteMany({});

      if (documents.length) {
        await collection.insertMany(documents, { ordered: false });
      }

      restoredCollections[collectionName] = documents.length;
    }

    return res.json({
      message: "Database restored successfully.",
      restoredCollections,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
