const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
<<<<<<< HEAD
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
    database: decodeURIComponent(url.pathname.replace(/^\//, "")) || undefined,
    multipleStatements: true,
    ssl,
  };
}
=======

const DATABASE_URL =
  'mysql://2J1akc6etHw1hsG.root:ymS2py7aHYiyi3Vg3Ko@gateway01.sa-east-1.prod.aws.tidbcloud.com:4000?ssl={"rejectUnauthorized":true}';
>>>>>>> aeed053bf9ba943811be77abb03dd6cc50a05acc

async function run() {
  const sqlPath = path.join(__dirname, "001_initial.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

<<<<<<< HEAD
  const conn = await mysql.createConnection(buildConnectionOptions(process.env.DATABASE_URL));
=======
  const conn = await mysql.createConnection({
    uri: DATABASE_URL,
    multipleStatements: true,
    ssl: { rejectUnauthorized: true },
  });
>>>>>>> aeed053bf9ba943811be77abb03dd6cc50a05acc

  await conn.query(sql);
  console.log("Script 001_initial.sql executado com sucesso no TiDB Cloud!");
  await conn.end();
}

run().catch((err) => {
  console.error("Erro ao executar SQL:", err);
  process.exit(1);
<<<<<<< HEAD
});
=======
});
>>>>>>> aeed053bf9ba943811be77abb03dd6cc50a05acc
