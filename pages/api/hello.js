// pages/api/cloudflare.js

const fetch = require('node-fetch');

export default async function handler(req, res) {
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress);
  const workerDomain = 'dash.epsyblog-euro.shop';

  // Adapt the URL to point to the target server
  const targetUrl = new URL(req.url);
  targetUrl.hostname = workerDomain;
  targetUrl.protocol = req.headers['x-forwarded-proto'] || 'https';

  // Create a new request object with the modified URL and headers
  const targetRequest = new fetch.Request(targetUrl.toString(), {
    method: req.method,
    headers: {
      ...req.headers,
      'Host': workerDomain,
      'cf-connecting-ip': ip,
    },
    body: req.body, // If you have a request body
  });

  try {
    // Forward the modified request to the target server and get the response
    const targetResponse = await fetch(targetRequest);

    // Create a response object with the target server's response
    const response = new fetch.Response(targetResponse.body, {
      status: targetResponse.status,
      statusText: targetResponse.statusText,
      headers: targetResponse.headers,
    });

    // Set the modified response on the Next.js response object
    res.status(response.status).send(await response.text());
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
}
