import app from "./app";

// DATABASE_URL is required — check early and exit gracefully if missing.
if (!process.env["DATABASE_URL"]) {
  console.error(
    "Error: DATABASE_URL environment variable is not set.\n" +
      "Please add it to your .env file and try again.",
  );
  process.exit(1);
}

// PORT defaults to 5000 if not specified in the environment / .env file.
const rawPort = process.env["PORT"] ?? "5000";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  console.error(`Error: Invalid PORT value: "${rawPort}"`);
  process.exit(1);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
