/*
  LUMI-VEST publishing relay (Cloudflare Worker)

  Holds the GitHub token as a SECRET so it never reaches the browser. Requests claiming the
  authorized email (X-Admin-Email header) can commit listings.json and img/listings/* to the
  configured repository. NOTE: the header is not proof of identity.

  Secrets / variables (see README.md):
    GITHUB_TOKEN     fine-grained token, Contents: Read and write, this repo only   (secret)
    GH_OWNER, GH_REPO, GH_BRANCH   where the site lives                             (variables)
    ALLOWED_ORIGIN   your site, e.g. https://lumi-vest.vercel.app  (optional, default *)
*/

const ADMIN_EMAIL = "jesevelarrealestate@gmail.com";

/* Size limits. GitHub refuses any file over 100 MB and every commit stays in history,
   so the relay refuses big files long before GitHub would. Sizes are DECODED bytes. */
const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
const MAX_LISTINGS_BYTES = 2 * 1024 * 1024;
const MAX_BODY = 36 * 1024 * 1024; // base64 + JSON overhead of one max-size media file

// whole files, plus the pieces of a big video: <name>.part001, .part002 … and <name>.parts.json
const MEDIA_RE = /^img\/listings\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp|gif|mp4|webm|mov|part\d{3}|parts\.json)$/;
const MAX_PART_BYTES = 12 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 64 * 1024;

const cors = (env) => ({
  "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, X-Admin-Email",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
});

const json = (env, status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(env) },
  });

function authenticate(request) {
  const email = (request.headers.get("X-Admin-Email") || "").trim().toLowerCase();
  return email === ADMIN_EMAIL ? email : null;
}

function decodeBase64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors(env) });

    const url = new URL(request.url);
    const email = authenticate(request);
    if (!email) return json(env, 401, { message: "Email is not authorized" });

    if (url.pathname === "/auth" && request.method === "POST")
      return json(env, 200, { ok: true });

    const m = /^\/contents(?:\/(.*))?$/.exec(url.pathname);
    if (!m) return json(env, 404, { message: "Not found" });
    let path;
    try {
      path = decodeURIComponent(m[1] || "").replace(/\/+$/, "");
    } catch {
      return json(env, 400, { message: "Bad path" });
    }
    if (path.includes("..")) return json(env, 400, { message: "Bad path" });

    const api = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents${path ? "/" + path.split("/").map(encodeURIComponent).join("/") : ""}`;
    const headers = {
      Accept: request.headers.get("Accept") || "application/vnd.github+json",
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "User-Agent": "lumi-vest-admin",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    const branch = env.GH_BRANCH || "main";

    if (request.method === "GET") {
      if (!["", "listings.json", "img/listings"].includes(path))
        return json(env, 403, { message: "Path not allowed" });
      const res = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers });
      return new Response(res.body, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("Content-Type") || "application/json",
          ...cors(env),
        },
      });
    }

    if (request.method === "PUT") {
      const isListings = path === "listings.json";
      if (!isListings && !MEDIA_RE.test(path))
        return json(env, 403, { message: "Path not allowed" });

      if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY)
        return json(env, 413, {
          message: "File too large. Videos must be under 25 MB — GitHub rejects files over 100 MB.",
        });

      let b;
      try {
        b = await request.json();
      } catch {
        return json(env, 400, { message: "Bad JSON" });
      }
      if (typeof b.content !== "string" || !b.content)
        return json(env, 400, { message: "Missing content" });

      // Real size check on the decoded content (Content-Length can be absent or wrong)
      const pad = b.content.endsWith("==") ? 2 : b.content.endsWith("=") ? 1 : 0;
      const decodedBytes = Math.floor((b.content.length * 3) / 4) - pad;
      const cap = isListings
        ? MAX_LISTINGS_BYTES
        : /\.parts\.json$/.test(path)
        ? MAX_MANIFEST_BYTES
        : /\.part\d{3}$/.test(path)
        ? MAX_PART_BYTES
        : MAX_MEDIA_BYTES;
      if (decodedBytes > cap)
        return json(env, 413, {
          message: `File is ${(decodedBytes / 1048576).toFixed(1)} MB; the limit is ${+(cap / 1048576).toFixed(2)} MB per file. Big videos are split into parts by the admin panel; GitHub rejects files over 100 MB.`,
        });

      // listings.json must be a real listings array with no embedded media blobs
      if (isListings) {
        try {
          const arr = JSON.parse(new TextDecoder().decode(decodeBase64(b.content)));
          if (!Array.isArray(arr)) throw new Error("not an array");
          const embedded = arr.some((p) =>
            ((p && p.media) || []).some((x) => /^data:/i.test(String((x && x.src) || "")))
          );
          if (embedded)
            return json(env, 400, { message: "listings.json must not contain embedded (data:) media" });
        } catch {
          return json(env, 400, { message: "listings.json must be a valid JSON array" });
        }
      }

      const body = {
        message: `${String(b.message || "Update").slice(0, 120)} — by ${email}`,
        content: b.content,
        branch,
        ...(b.sha ? { sha: String(b.sha) } : {}),
      };
      const res = await fetch(api, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return new Response(res.body, {
        status: res.status,
        headers: { "Content-Type": "application/json", ...cors(env) },
      });
    }

    return json(env, 405, { message: "Method not allowed" });
  },
};
