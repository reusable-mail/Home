// Enhanced Vercel serverless function for proxying requests with CORS support
export default async function handler(req, res) {
  // Setup CORS headers to allow all origins
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get URL from request body or query param
    const requestData = req.body || {};
    const { url: bodyUrl, formData } = requestData;
    const queryUrl = req.query.url;
    
    // Determine the target URL, fallback to default
    const targetUrl = bodyUrl || queryUrl || 'https://reusable.email/';
    console.log(`Proxying request to: ${targetUrl}`);
    
    // Create the fetch options
    const fetchOptions = {
      method: req.method,
      headers: {
        // Set appropriate headers based on the request type
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://reusable.email/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    };
    
    // Handle different content types
    if (req.method === 'POST') {
      if (formData) {
        // Handle form submissions
        const formParams = new URLSearchParams();
        Object.entries(formData).forEach(([key, value]) => {
          formParams.append(key, value);
        });
        fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        fetchOptions.body = formParams.toString();
      } else {
        // Handle JSON submissions
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(req.body);
      }
    }
    
    console.log('Fetch options:', JSON.stringify(fetchOptions));
    
    // Make the external request
    const response = await fetch(targetUrl, fetchOptions);
    
    if (!response.ok) {
      console.error(`External API responded with status: ${response.status}`);
    }
    
    // Get the content type from the response
    const contentType = response.headers.get('content-type') || '';
    console.log(`Response content type: ${contentType}`);
    
    // Handle different response types
    if (contentType.includes('application/json')) {
      // For JSON responses
      const data = await response.json();
      res.status(response.status).json(data);
    } else if (contentType.includes('text/html')) {
      // For HTML responses
      const html = await response.text();
      
      // Process the HTML to fix relative URLs and other issues
      const processedHtml = processHtml(html, targetUrl);
      
      // Send the processed HTML
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(response.status).send(processedHtml);
    } else if (contentType.includes('text/css')) {
      // For CSS files
      const css = await response.text();
      // Process CSS to fix relative URLs
      const processedCss = processCSS(css, targetUrl);
      res.setHeader('Content-Type', 'text/css');
      res.status(response.status).send(processedCss);
    } else if (contentType.includes('image/') || 
               contentType.includes('font/') || 
               contentType.includes('application/font')) {
      // For binary files like images and fonts
      const data = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.status(response.status).send(Buffer.from(data));
    } else {
      // For all other content types
      const data = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.status(response.status).send(Buffer.from(data));
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Process HTML content to make it work in our proxy
function processHtml(html, baseUrl) {
  // Extract the base URL without the path
  const urlObj = new URL(baseUrl);
  const baseUrlRoot = `${urlObj.protocol}//${urlObj.host}`;
  
  // Fix various URL references in the HTML
  return html
    // Fix relative URLs in links
    .replace(/href="\/([^"]*)"/g, `href="/api/proxy-email?url=${baseUrlRoot}/$1"`)
    // Fix absolute URLs in links to same domain
    .replace(new RegExp(`href="${baseUrlRoot}/([^"]*)"`, 'g'), `href="/api/proxy-email?url=${baseUrlRoot}/$1"`)
    // Fix relative URLs in images and other resources
    .replace(/src="\/([^"]*)"/g, `src="${baseUrlRoot}/$1"`)
    // Fix relative URLs in forms
    .replace(/action="\/([^"]*)"/g, `action="/api/proxy-email?url=${baseUrlRoot}/$1"`)
    // Fix inline styles with url() references
    .replace(/url\(\s*\/([^)]*)\s*\)/g, `url(${baseUrlRoot}/$1)`)
    // Fix relative URLs in CSS links
    .replace(/href="([^"]*\.css)"/g, `href="/api/proxy-email?url=${baseUrlRoot}/$1"`)
    // Preserve inline SVG content
    .replace(/<svg([^>]*)>([\s\S]*?)<\/svg>/g, (match) => {
      // Encode the SVG to prevent its contents from being processed
      return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    })
    // Remove base tags that might interfere with our proxying
    .replace(/<base[^>]*>/g, '')
    // Allow all necessary scripts but wrapped in try-catch
    .replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, content) => {
      // If it's an external script, proxy it
      if (attrs.includes('src=')) {
        return match.replace(/src="\/([^"]*)"/g, `src="${baseUrlRoot}/$1"`);
      }
      
      // For inline scripts, wrap in try-catch
      return `<script${attrs}>
        try {
          ${content}
        } catch (e) {
          console.error('Script error:', e);
        }
      </script>`;
    });
}

// Process CSS to fix relative URLs
function processCSS(css, baseUrl) {
  const urlObj = new URL(baseUrl);
  const baseUrlRoot = `${urlObj.protocol}//${urlObj.host}`;
  
  return css
    // Fix URLs in url() references
    .replace(/url\(\s*['"]?\/?([^'")]+)['"]?\s*\)/g, `url(${baseUrlRoot}/$1)`)
    // Fix import statements with relative paths
    .replace(/@import\s+['"]?\/?([^'"]+)['"]?/g, `@import '${baseUrlRoot}/$1'`);
} 