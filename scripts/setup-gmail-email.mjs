#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { spawn } from "node:child_process";

const envPath = path.join(process.cwd(), ".env.local");
const backupPath = path.join(process.cwd(), `.env.local.backup.${Date.now()}`);

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function stringifyEnv(env) {
  return Object.entries(env)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${escapeEnvValue(String(value))}`)
    .join("\n") + "\n";
}

function escapeEnvValue(value) {
  if (/[\s#"']/g.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

function ask(question, rl) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}

function openUrl(url) {
  const platform = process.platform;
  if (platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true }).unref();
    return;
  }
  if (platform === "darwin") {
    spawn("open", [url], { stdio: "ignore", detached: true }).unref();
    return;
  }
  spawn("xdg-open", [url], { stdio: "ignore", detached: true }).unref();
}

async function main() {
  console.log("\n=== Configuracion de email Gmail para Rivas Hockey TV ===\n");
  console.log("Este script no guarda tu contrasena normal de Gmail.");
  console.log("Necesitas activar 2FA y crear una App Password de Google.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const openGoogle = await ask("Abrir ahora las paginas de Google (2FA + App Password)? (s/n): ", rl);
  if (openGoogle.toLowerCase() === "s") {
    openUrl("https://myaccount.google.com/security");
    openUrl("https://myaccount.google.com/apppasswords");
    console.log("Se abrieron las paginas en tu navegador.\n");
  }

  const gmailUser = await ask("GMAIL_USER (ejemplo club@gmail.com): ", rl);
  const appPasswordRaw = await ask("GMAIL_APP_PASSWORD (16 chars, puedes pegar con espacios): ", rl);
  const emailFromInput = await ask("EMAIL_FROM (deja vacio para usar Rivas Hockey TV <GMAIL_USER>): ", rl);
  const providerInput = await ask("EMAIL_PROVIDER [gmail/auto] (default gmail): ", rl);

  rl.close();

  if (!gmailUser || !gmailUser.includes("@")) {
    console.error("GMAIL_USER no valido.");
    process.exit(1);
  }

  const appPassword = appPasswordRaw.replace(/\s+/g, "");
  if (appPassword.length < 16) {
    console.error("GMAIL_APP_PASSWORD parece invalida. Debe venir de Google App Password.");
    process.exit(1);
  }

  const provider = providerInput.toLowerCase() === "auto" ? "auto" : "gmail";
  const emailFrom = emailFromInput || `Rivas Hockey TV <${gmailUser}>`;

  let env = {};
  if (fs.existsSync(envPath)) {
    const current = fs.readFileSync(envPath, "utf8");
    fs.writeFileSync(backupPath, current, "utf8");
    env = parseEnv(current);
  }

  env.EMAIL_PROVIDER = provider;
  env.GMAIL_USER = gmailUser;
  env.GMAIL_APP_PASSWORD = appPassword;
  env.EMAIL_FROM = emailFrom;

  fs.writeFileSync(envPath, stringifyEnv(env), "utf8");

  console.log("\nConfiguracion guardada en .env.local");
  if (fs.existsSync(backupPath)) {
    console.log(`Backup creado: ${path.basename(backupPath)}`);
  }
  console.log("\nSiguiente paso recomendado:");
  console.log("- npm run typecheck");
  console.log("- npm run lint");
  console.log("- Probar crear usuario desde Admin y comprobar recepcion de correo.\n");
}

main().catch((err) => {
  console.error("Error en setup Gmail:", err?.message || err);
  process.exit(1);
});
