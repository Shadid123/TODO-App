const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function createRateLimiter({ windowMs, maxRequests }) {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const bucket = buckets.get(key);

    for (const [bucketKey, value] of buckets.entries()) {
      if (now - value.windowStart >= windowMs) {
        buckets.delete(bucketKey);
      }
    }

    if (!bucket || now - bucket.windowStart >= windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return next();
    }

    if (bucket.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    bucket.count += 1;
    return next();
  };
}

function isSameHost(headerValue, requestHost) {
  try {
    return new URL(headerValue).host === requestHost;
  } catch (_error) {
    return false;
  }
}

function requireSameOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const host = req.get('host');
  const origin = req.get('origin');
  const referer = req.get('referer');

  if (origin && !isSameHost(origin, host)) {
    return res.status(403).json({ error: 'Invalid origin' });
  }

  if (!origin && referer && !isSameHost(referer, host)) {
    return res.status(403).json({ error: 'Invalid referer' });
  }

  return next();
}

module.exports = {
  createRateLimiter,
  requireSameOrigin
};
