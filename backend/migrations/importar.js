const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const DATABASE_URL =
  'mysql://2J1akc6etHw1hsG.root:ymS2py7aHYiyi3Vg3Ko@gateway01.sa-east-1.prod.aws.tidbcloud.com:4000?ssl={"rejectUnauthorized":true}';

async function run() {
  const sqlPath = path.join(__dirname, "001_initial.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const conn = await mysql.createConnection({
    uri: DATABASE_URL,
    multipleStatements: true,
    ssl: { rejectUnauthorized: true },
  });

  await conn.query(sql);
  console.log("Script 001_initial.sql executado com sucesso no TiDB Cloud!");
  await conn.end();
}

run().catch((err) => {
  console.error("Erro ao executar SQL:", err);
  process.exit(1);
});
