import express from "express";
import cors from "cors";
import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";

const app = express();
const password = "supersecretpassword";

app.use(cors());

app.get("/search", (req, res) => {
  const sql = "SELECT * FROM users WHERE name = '" + req.query.name;
  database.query(sql);
  res.send(`Hello ${req.query.name}`);
});

app.get("/run", (req, res) => {
  exec("ping " + req.query.host);
  res.send("started");
});

app.get("/file", async (req, res) => {
  const content = await readFile(req.query.path);
  res.send(content);
});

app.get("/go", (req, res) => {
  res.redirect(req.query.next);
});

app.get("/admin", (req, res) => {
  res.json({ password });
});

export default app;
