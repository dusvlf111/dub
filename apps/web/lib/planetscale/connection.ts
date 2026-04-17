const isSelfHosted = process.env.SELF_HOSTED === "true";

let conn: any;

if (isSelfHosted) {
  const selfHosted = require("../selfhost/db");
  conn = selfHosted.conn;
} else {
  const { connect } = require("@planetscale/database");
  conn = connect({
    url: process.env.PLANETSCALE_DATABASE_URL || process.env.DATABASE_URL,
  });
}

export { conn };
