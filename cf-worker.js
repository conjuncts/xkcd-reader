export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Trim leading slashes
    const path = url.pathname.replace(/^\/+/, "");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    let upstreamURL;

    // /latest
    if (path === "" || path === "latest") {
      upstreamURL = "https://xkcd.com/info.0.json";
    }
    // /123
    else if (/^\d+$/.test(path)) {
      upstreamURL = `https://xkcd.com/${path}/info.0.json`;
    }
    // anything else
    else {
      return new Response("Not Found", {
        status: 404,
        headers: corsHeaders(),
      });
    }

    const resp = await fetch(upstreamURL, {
      headers: {
        "User-Agent": "readxkcd-worker/1.0",
        "Accept": "application/json",
      },
    });

    const headers = new Headers(resp.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(resp.body, {
      status: resp.status,
      headers,
    });
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

// then, need to add domain to worker in cloudflare: api.<your_domain>.com
