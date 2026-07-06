import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

if (!databaseUrl.startsWith("file:")) {
  throw new Error("Only SQLite file: DATABASE_URL values are supported by this helper.");
}

const rawPath = databaseUrl.slice("file:".length);
const dbPath = rawPath.startsWith("./")
  ? resolve("prisma", rawPath.slice(2))
  : resolve(rawPath);

mkdirSync(dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

try {
  db.exec("PRAGMA foreign_keys = ON;");

  if (!tableExists(db, "User")) {
    applySql(db, "prisma/migrations/20260706124000_init/migration.sql");
    console.log("Applied migration 20260706124000_init");
  } else {
    console.log("Skipped migration 20260706124000_init");
  }

  if (!columnExists(db, "InspectionItem", "version")) {
    applySql(
      db,
      "prisma/migrations/20260706170500_add_inspection_item_version/migration.sql"
    );
    console.log("Applied migration 20260706170500_add_inspection_item_version");
  } else {
    console.log("Skipped migration 20260706170500_add_inspection_item_version");
  }

  if (!columnExists(db, "TemplateItem", "section")) {
    applySql(
      db,
      "prisma/migrations/20260706184000_add_template_item_section/migration.sql"
    );
    console.log("Applied migration 20260706184000_add_template_item_section");
  } else {
    console.log("Skipped migration 20260706184000_add_template_item_section");
  }
} finally {
  db.close();
}

function applySql(database, filePath) {
  const sql = readFileSync(filePath, "utf8");
  database.exec(sql);
}

function tableExists(database, tableName) {
  const row = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName);
  return Boolean(row);
}

function columnExists(database, tableName, columnName) {
  if (!existsSync(dbPath) || !tableExists(database, tableName)) {
    return false;
  }

  const columns = database.prepare(`PRAGMA table_info("${tableName}")`).all();
  return columns.some((column) => column.name === columnName);
}
