// Enhanced Vercel serverless function for proxying requests
export default async function handler(req, res) {
  try {
    const { url: queryUrl, formData } = req.body || {};
    
    // Get the target URL from query param, body, or use default
    const targetUrl = queryUrl || req.query.url || 'https://reusable.email/';
    
    // Set up fetch options based on the request method
    const fetchOptions = {
      method: req.method,
      headers: {
        // Set appropriate content type for the request
        'Content-Type': req.method === 'POST' && formData ? 
          'application/x-www-form-urlencoded' : 'text/html',
        // Add headers that the target site would expect
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://reusable.email/',
      },
    };
    
    // If we have form data in a POST request, format it properly
    if (req.method === 'POST' && formData) {
      const formParams = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        formParams.append(key, value);
      });
      fetchOptions.body = formParams.toString();
    }
    
    // Make request to the external service
    const response = await fetch(targetUrl, fetchOptions);
    
    // Get response data
    const contentType = response.headers.get('content-type') || '';
    let data;
    
    if (contentType.includes('application/json')) {
      data = await response.json();
      res.status(response.status).json(data);
    } else {
      data = await response.text();
      
      // Set appropriate headers for the response
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(response.status).send(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch data', message: error.message });
  }
} 