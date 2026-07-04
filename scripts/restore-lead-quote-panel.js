const { execSync } = require("child_process");
const fs = require("fs");
const path = "src/components/admin/LeadQuotePanel.tsx";

for (const ref of ["eb99e37", "HEAD"]) {
  try {
    const content = execSync(`git show ${ref}:${path}`, { encoding: "utf8" });
    if (content.includes("use client") && content.includes("LeadQuotePanel")) {
      fs.writeFileSync(path, content, "utf8");
      console.log(`restored from ${ref}, ${content.split("\n").length} lines`);
      process.exit(0);
    }
  } catch {
    console.log(`${ref} failed`);
  }
}
process.exit(1);
