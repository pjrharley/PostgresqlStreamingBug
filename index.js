const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const postgres = require("postgres");
const crypto = require("crypto");

function randomRow() {
  return {
    id: crypto.randomUUID(),
    foo: crypto.randomUUID(),
    bar: crypto.randomUUID(),
  };
}

async function streamToString(
  stream
) {
  const chunks = [];
  stream.on("data", chunk => chunks.push(Buffer.from(chunk)));
  return new Promise((resolve, reject) => {
    stream.on("end", () => {
      const allData = Buffer.concat(chunks).toString("utf-8");
      console.log("Consumed all the data: " + allData.length);
      resolve(allData);
    });
    stream.on("error", reject);
  })
}


async function main() {
  const container = await new PostgreSqlContainer()
    .withUsername("psqladmin")
    .start();


  const sql = postgres({
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getPassword(),
    ssl: false,
  });

  await sql`create table public.testtable
            (
                id uuid not null
                    constraint customerid_pk
                        primary key,
                foo  varchar,
                bar  varchar
            )`;
  const randomRows = [...Array(500).keys()]
    .map(_ => randomRow());
  await sql`insert into testtable ${sql(randomRows)}`;

  console.log("start test");
  await sql.begin(async (sql) => {
    const table = "testtable";
    console.log("doing 1");
    console.time("done 1");
    const stream1 = await sql`COPY (SELECT 
            id, foo, bar
            FROM ${sql(
      table,
    )}) TO stdout WITH DELIMITER ',' CSV HEADER`.readable();
    await streamToString(stream1);
    console.timeEnd("done 1")


    console.log("doing 2");
    console.time("done 2");
    const stream2 = await sql`COPY (SELECT 
            id, foo, bar
            FROM ${sql(
      table,
    )}) TO stdout WITH DELIMITER ',' CSV HEADER`.readable();
    await streamToString(stream2);
    console.timeEnd("done 2");
  });
  console.log("finished test");
  await sql.end();
  await container.stop();
}

main()
  .then(() => console.log("Done!"))
  .catch(e => console.error("Error: " + e.message));