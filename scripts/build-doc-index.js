// scripts/build-doc-index.js
const fs = require("fs");
const path = require("path");

const DOCS = [
  { doc_id: "KCSIE_2025", file: "docs/kcsie-2025.txt" },
  { doc_id: "WTSC_2023", file: "docs/working-together-2023.txt" },
];

function normalise(s) {
  return s.replace(/\r\n/g, "\n").trim();
}

// Split paragraphs on blank lines
function splitParas(text) {
  return normalise(text)
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

const index = [];

for (const doc of DOCS) {
  const fullPath = path.join(process.cwd(), doc.file);
  const text = fs.readFileSync(fullPath, "utf8");
  const paras = splitParas(text);

  paras.forEach((paraText, i) => {
    index.push({
      doc_id: doc.doc_id,
      para: i + 1,
      text: paraText,
    });
  });
}

fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
fs.writeFileSync(
  path.join(process.cwd(), "data", "doc_index.json"),
  JSON.stringify(index, null, 2),
  "utf8"
);

console.log(`Built doc index: ${index.length} paragraphs`);
