# URL Shortener for Cloudflare Workers

A simple URL shortener running on Cloudflare Workers with IP-based access control and persistent storage that is fully deployable on Cloudflare's free tier.

> **New to Cloudflare Workers?** Check out the [Getting Started Guide](https://developers.cloudflare.com/workers/get-started/guide/) to learn the basics.

## Features

- Create short URLs via POST request
- List endpoint to view all URLs
- IP-based allow-list for security
- Persistent storage using SQLite-based Durable Objects (no external database required)

## Stack

- Cloudflare Worker (100,000 requests/day on free tier)
- URL Store as a SQLite-based Durable Object (available on free tier for persistent storage)
- Deploy to `*.workers.dev` subdomain or use your own custom domain with automatic HTTPS (both included in free tier)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure allowed IPs and short code length in `wrangler.jsonc`:
```jsonc
{
  "vars": {
    "ADMIN_ALLOWED_IPS": "192.168.1.1,10.0.0.0/8,2001:db8::1,2001:db8::/32",
    "PUBLIC_ALLOWED_IPS": "0.0.0.0/0,::/0",
    "SHORT_CODE_LENGTH": "4"
  }
}
```

- `ADMIN_ALLOWED_IPS`: IPs allowed to access admin routes (`/new`, `/list`, `/flush`). If not set or empty, no IPs are allowed.
- `PUBLIC_ALLOWED_IPS`: IPs allowed to consume short URLs (`/{code}`). If not set or empty, no IPs are allowed.
- `SHORT_CODE_LENGTH`: Length of generated short codes. Defaults to 4 if not set or set to 0.

Supports both IPv4 and IPv6 addresses, including CIDR notation (e.g., `/24`, `/64`). Multiple IPs and ranges can be comma-separated.

Or set via Cloudflare Dashboard for production.

## Development

```bash
npm run dev
```

## Deployment

```bash
npm run deploy
```

## API Endpoints

### 1. Create Short URL

Create a new short URL. IP restriction controlled by `ADMIN_ALLOWED_IPS` (defaults to no IPs are allowed if not set).

```bash
curl -X POST https://yourdomain.com/new \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Response:**
```json
{
  "code": "aB3x",
  "url": "https://example.com"
}
```

### 2. Get/Redirect Short URL

Redirect to the original URL. IP restriction controlled by `PUBLIC_ALLOWED_IPS` (defaults to allow all if not set).

```bash
curl -L https://yourdomain.com/aB3x
```

The `-L` flag follows redirects automatically.

### 3. List All URLs

List all short URLs. IP restriction controlled by `ADMIN_ALLOWED_IPS` (defaults to no IPs are allowed if not set).

```bash
curl https://yourdomain.com/list
```

**Response:**
```json
[
  { "code": "aB3x", "url": "https://example.com" },
  { "code": "xY9z", "url": "https://another.com" }
]
```

### 4. Clear All URLs (Flush)

Clear all short URLs from storage. IP restriction controlled by `ADMIN_ALLOWED_IPS` (defaults to no IPs are allowed if not set).

```bash
curl -X POST https://yourdomain.com/flush
```

**Response:**
```json
{
  "message": "All URLs cleared"
}
```

## Security

- Routes `/new`, `/list`, and `/flush` use `ADMIN_ALLOWED_IPS` for IP filtering
- Routes `/{code}` use `PUBLIC_ALLOWED_IPS` for IP filtering
- If an environment variable is not set or empty, no IPs are allowed for that route type
- Configure environment variables with comma-separated IP addresses
- Supports IPv4, IPv6, and CIDR notation (e.g., `192.168.1.0/24`, `2001:db8::/32`)

## Notes

- URLs are stored persistently using SQLite-based Durable Objects storage and survive restarts
- Short codes are random alphanumeric strings with configurable length (default: 4 characters)

