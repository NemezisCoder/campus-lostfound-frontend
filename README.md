# campus-lostfound-frontend

React/Vite frontend for the Campus Lost & Found application.

## Environment variables

Only public browser-facing values should use Vite's `VITE_*` prefix. Use `.env.example` as the committed template and keep local overrides in `.env.local` or `.env.*.local`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `/api/v1` | Base URL used by the shared Axios client for REST requests and uploads. |
| `VITE_SOCKET_URL` | current browser origin | Optional Socket.IO origin. Leave empty when the reverse proxy serves `/socket.io` from the same origin. |
| `VITE_API_ORIGIN` | derived from `VITE_API_URL` or current origin | Optional origin prefix for relative media URLs returned by the backend. |

## Local development

```bash
npm ci
npm run dev
```

The Vite dev server proxies `/api` and `/socket.io` to `http://backend:5050` by default. Override this target with `VITE_DEV_PROXY_TARGET` if your backend runs elsewhere:

```bash
VITE_DEV_PROXY_TARGET=http://localhost:8000 npm run dev
```

## Production container

The Docker image builds static assets with Vite and serves the `dist` output from Nginx with SPA fallback routing and a `/healthz` endpoint.

```bash
docker build -t campus-lostfound-frontend .
docker run --rm -p 8080:80 campus-lostfound-frontend
curl http://localhost:8080/healthz
```

## Quality checks

```bash
npm run lint
npm run test:run
npm run build
```

## CI/CD

GitHub Actions automation is defined in `.github/workflows/ci-cd.yml`. It runs lint/type checks, tests, production builds, Docker image builds, container smoke checks, GHCR publication, and SSH-based deployment after successful checks on `main`. See `docs/ci-cd.md` for the required GitHub secrets and the server-side Docker Compose contract.
