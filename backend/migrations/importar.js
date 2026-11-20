const fs = require("fs");
const mysql = require("mysql2/promise");

const DATABASE_URL =
  'mysql://2J1akc6etHw1hsG.root:ymS2py7aHYiyi3Vg3Ko@gateway01.sa-east-1.prod.aws.tidbcloud.com:4000/pulsevida?ssl={"rejectUnauthorized":true}';

async function run() {
  const sql = fs.readFileSync("./schema.sql", "utf8"); // troque para o nome real do seu arquivo .sql
  const conn = await mysql.createConnection({
    uri: DATABASE_URL,
    multipleStatements: true,
    ssl: { rejectUnauthorized: true },
  });

  await conn.query(sql);
  console.log("Script SQL executado com sucesso no TiDB Cloud!");
  await conn.end();
}

run().catch((err) => {
  console.error("Erro ao executar SQL:", err);
});
