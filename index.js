export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const subdomain = url.hostname.split('.')[0]

    // Reconstruct target URL
    const proxyUrl = `https://reverse-proxy-server-p4z0.onrender.com${url.pathname}`

    // Clone request with original method, headers
    const modifiedRequest = new Request(proxyUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "manual",
    })

    // Add X-Subdomain header
    modifiedRequest.headers.set("X-Subdomain", subdomain)

    return fetch(modifiedRequest)
  }
}
