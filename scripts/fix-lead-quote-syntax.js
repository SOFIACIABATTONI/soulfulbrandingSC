const fs = require("fs");
const path = "src/components/admin/LeadQuotePanel.tsx";
let s = fs.readFileSync(path, "utf8");

const broken = `                </div>
              )}

              {active.sentAt && (
                <p className="text-[10px]" style={{ color: "rgba(13,13,13,0.42)" }}>
                  Enviado: {new Date(active.sentAt).toLocaleString("es-AR")}
                  {active.viewedAt &&
                    \` · Visto: \${new Date(active.viewedAt).toLocaleString("es-AR")}\`}
                  {active.respondedAt &&
                    \` · Respondido: \${new Date(active.respondedAt).toLocaleString("es-AR")}\`}
                </p>
              )}
            </div>
          )}`;

const fixed = `                </div>
              ))}

              {editorOpen && active.respondedAt && (
                <p className="text-[10px]" style={{ color: "rgba(19,25,69,0.42)" }}>
                  Respondido: {new Date(active.respondedAt).toLocaleString("es-AR")}
                </p>
              )}
            </div>
          )}`;

if (!s.includes(broken)) {
  // try without escaped backticks
  const altBroken = broken.replace(/\\`/g, "`").replace(/\\\$/g, "$");
  if (s.includes(altBroken)) {
    s = s.replace(altBroken, fixed);
  } else {
    console.error("Pattern not found");
    const idx = s.indexOf("              )}\n\n              {active.sentAt");
    console.error("idx", idx);
    process.exit(1);
  }
} else {
  s = s.replace(broken, fixed);
}

fs.writeFileSync(path, s, "utf8");
console.log("fixed closing parens");
