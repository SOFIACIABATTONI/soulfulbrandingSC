const fs = require("fs");
const path = "src/components/admin/LeadQuotePanel.tsx";
let s = fs.readFileSync(path, "utf8");

if (!s.includes("resolvedClientId")) {
  s = s.replace(
    "  const [lastLink, setLastLink] = useState<string | null>(null);",
    `  const [lastLink, setLastLink] = useState<string | null>(null);
  const [resolvedClientId, setResolvedClientId] = useState<string | null>(clientId ?? null);`,
  );

  s = s.replace(
    "  useEffect(() => {\n    void load();\n  }, [load]);",
    `  useEffect(() => {
    setResolvedClientId(clientId ?? null);
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (resolvedClientId || loading) return;
    const hasApproved = quotes.some((q) => q.status === "aprobado");
    if (!hasApproved) return;
    void fetch(\`/api/admin/leads/\${leadId}/ensure-client\`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((j: { clientId?: string } | null) => {
        if (j?.clientId) setResolvedClientId(j.clientId);
      })
      .catch(() => undefined);
  }, [resolvedClientId, loading, quotes, leadId]);`,
  );

  s = s.replace(
    "      {clientId && (",
    "      {resolvedClientId && (",
  );

  s = s.replace(
    'href={"/admin/clientes/" + clientId}',
    'href={"/admin/clientes/" + resolvedClientId}',
  );
}

fs.writeFileSync(path, s, "utf8");
console.log("LeadQuotePanel client sync patched");
