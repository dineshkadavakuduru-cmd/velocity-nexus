// Fails the build if any public asset referenced by src/ is missing.
// Run: npm run assets:check (wired into CI before `next build` via README instructions).
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const missing = [];
const check = (rel) => {
  if (!fs.existsSync(path.join(ROOT, "public", rel))) missing.push("public/" + rel);
};

const audioSrc = fs.readFileSync(path.join(ROOT, "src", "lib", "audio.ts"), "utf8");
for (const m of audioSrc.matchAll(/\/sounds\/([\w\-.]+\.\w+)/g)) check("sounds/" + m[1]);

const constSrc = fs.readFileSync(path.join(ROOT, "src", "lib", "constants.ts"), "utf8");
for (const m of constSrc.matchAll(/thumbnail:\s*"([^"]+)"/g)) check("tracks/" + m[1]);

["textures/road-asphalt.jpg", "textures/road-normal.jpg"].forEach(check);
[
  "textures/particles/smoke.png",
  "textures/particles/spark.png",
  "textures/particles/nitro-flame.png",
].forEach(check);

if (missing.length > 0) {
  console.error("Missing public assets:\n - " + missing.join("\n - "));
  process.exit(1);
}
console.log("All referenced public assets present.");
