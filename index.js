require('dotenv').config({ path: './.env' })

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const subdomain = url.hostname.split('.')[0]
    
    // Check if this is a CDN request
    if (url.hostname === 'cdn.letshost.dpdns.org') {
      return await handleCDNRequest(request, url)
    }

    // Original proxy logic for non-CDN requests
    const proxyUrl = `${process.env.BASE_URI}${url.pathname}`
    
    const modifiedRequest = new Request(proxyUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "manual",
    })
    
    modifiedRequest.headers.set("X-Subdomain", subdomain)
    
    return fetch(modifiedRequest)
  }
}

async function handleCDNRequest(request, url) {
  let targetUrl
  
  // Determine file type based on extension
  const fileExtension = url.pathname.split('.').pop().toLowerCase()
  
  // Handle video files
  if (['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'm4v'].includes(fileExtension)) {
    if (url.search) {
      // Has query params - use imgix
      targetUrl = `https://letshost.imgix.net/testifywebdev${url.pathname}${url.search}`
    } else {
      // No query params - use Cloudinary
      targetUrl = `https://res.cloudinary.com/testifywebdev${url.pathname}`
    }
  }
  // Handle image files
  else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(fileExtension)) {
    if (url.search) {
      // Has query params - use imgix
      targetUrl = `https://letshost.imgix.net/testifywebdev${url.pathname}${url.search}`
    } else {
      // No query params - use Cloudinary
      targetUrl = `https://res.cloudinary.com/testifywebdev${url.pathname}`
    }
  }
  // Handle CSS and JS files
  else if (['css', 'js'].includes(fileExtension)) {
    // Always use Supabase for CSS and JS files
    targetUrl = `https://fhymsbxuaexnnakojxzk.supabase.co/storage/v1/object/public/cdn${url.pathname}${url.search || ''}`
  }
  else {
    // Fallback for unknown file types
    targetUrl = `https://fhymsbxuaexnnakojxzk.supabase.co/storage/v1/object/public/cdn${url.pathname}${url.search || ''}`
  }

  try {
    // Create the proxy request
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: "manual",
    })

    // Remove the Host header to avoid conflicts
    proxyRequest.headers.delete('Host')
    
    // Fetch from the target URL
    const response = await fetch(proxyRequest)
    
    // Create a new response with the same body and headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
    
    // Preserve all original headers from the target service
    // This ensures CORS, Content-Type, Cache-Control, etc. are maintained
    
    return newResponse
    
  } catch (error) {
    // Return error response
    return new Response(`Proxy Error: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }
}
