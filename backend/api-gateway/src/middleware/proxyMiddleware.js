const axios = require('axios');

/**
 * Creates a proxy handler that forwards requests to a target service.
 * Preserves headers, query params, body, and passes through the response.
 */
const createProxy = (targetBaseUrl) => {
  return async (req, res) => {
    try {
      // Build target URL: strip the gateway prefix but use req.path rather than req.originalUrl
      // req.originalUrl contains the query string, which axios would append again via config.params
      const targetPath = req.path.replace(/^\/api\/(auth|users|search|flights|seats|booking|payment|checkin|pricing|notifications|admin|webhook|oauth)/, '');
      const targetUrl = `${targetBaseUrl}${targetPath || '/'}`;

      const config = {
        method: req.method.toLowerCase(),
        url: targetUrl,
        headers: {
          ...req.headers,
          host: undefined // Remove host header
        },
        params: req.query,
        timeout: 30000
      };

      // Forward body for POST/PUT/PATCH
      if (['post', 'put', 'patch'].includes(config.method)) {
        config.data = req.body;
      }

      const response = await axios(config);

      // Forward cookies from downstream service
      if (response.headers['set-cookie']) {
        res.set('set-cookie', response.headers['set-cookie']);
      }

      res.status(response.status).json(response.data);
    } catch (error) {
      if (error.response) {
        // Forward cookies even on errors (e.g., auth cookies on successful login via 2xx)
        if (error.response.headers?.['set-cookie']) {
          res.set('set-cookie', error.response.headers['set-cookie']);
        }
        res.status(error.response.status).json(error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        res.status(503).json({ error: 'Service unavailable', service: targetBaseUrl });
      } else {
        res.status(500).json({ error: 'Gateway error', message: error.message });
      }
    }
  };
};

module.exports = { createProxy };
