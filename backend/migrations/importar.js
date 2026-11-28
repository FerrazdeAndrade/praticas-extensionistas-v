const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function buildConnectionOptions(rawUrl) {
  if (!rawUrl) {
    throw new Error("DATABASE_URL não configurada no .env.");
  }

  const url = new URL(rawUrl);
  const sslParam = url.searchParams.get("ssl") || url.searchParams.get("ssl-mode");

  let ssl = { rejectUnauthorized: true };
  if (sslParam) {
    try {
      const parsed = JSON.parse(sslParam);
      if (parsed && typeof parsed === "object") {
        ssl = parsed;
      }
    } catch {
      ssl = { rejectUnauthorized: !/allow|insecure|skip-verify/i.test(sslParam) };
    }
  }

  return {
    host: url.hostname,
    port: Number(url.port || 4000),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    multipleStatements: true,
    ssl,
  };
}

async function run() {
  const sqlPath = path.join(__dirname, "001_initial.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const conn = await mysql.createConnection(buildConnectionOptions(process.env.DATABASE_URL));

  await conn.query(sql);
  console.log("Script 001_initial.sql executado com sucesso no TiDB Cloud!");
  await conn.end();
}

run().catch((err) => {
  console.error("Erro ao executar SQL:", err);
  process.exit(1);
});
