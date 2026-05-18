# Frontend CI/CD pipeline

This repository uses `.github/workflows/ci-cd.yml` to satisfy the deployment automation requirements for the lab.

## What the workflow does

1. **On every pull request to `main` and every push to `main`:**
   - installs dependencies with `npm ci`;
   - runs the mandatory lint/type-check gate with `npm run lint`;
   - runs the test suite with `npm run test:run`;
   - builds production assets with `npm run build`;
   - builds the Docker image;
   - starts the image and checks `http://localhost:8080/healthz`.

2. **On pushes to `main` only:**
   - publishes the frontend image to GitHub Container Registry (GHCR);
   - tags the image with the branch name and immutable `sha-<commit>` tag;
   - deploys the target environment over SSH after all checks pass.

3. **Deployment behavior:**
   - connects to the deployment host by SSH;
   - writes `FRONTEND_IMAGE` and `FRONTEND_TAG` into the server-side `.env` file;
   - runs `docker compose pull frontend`;
   - runs `docker compose up -d frontend reverse-proxy`;
   - verifies the public health endpoint when `DEPLOY_HEALTH_URL` is configured.

## Required GitHub environment/secrets

Create a protected GitHub Environment named `production` and add these secrets:

| Secret | Required | Purpose |
| --- | --- | --- |
| `DEPLOY_HOST` | Yes | Hostname or IP address of the deployment server. |
| `DEPLOY_USER` | Yes | SSH user on the deployment server. |
| `DEPLOY_SSH_KEY` | Yes | Private SSH key with access to the deployment server. |
| `DEPLOY_PATH` | Yes | Directory on the server that contains the deployment `docker-compose.yml`. |
| `DEPLOY_PORT` | No | SSH port. Defaults to `22` if omitted. |
| `DEPLOY_HEALTH_URL` | Recommended | Public URL checked after deployment, for example `https://example.com/healthz`. |
| `GHCR_USERNAME` | Required for private packages | Username used by the remote server to pull from GHCR. |
| `GHCR_TOKEN` | Required for private packages | Token with permission to read the GHCR package from the remote server. |

The workflow uses the built-in `GITHUB_TOKEN` to publish images from GitHub Actions to GHCR.

## Server-side Docker Compose contract

The target `docker-compose.yml` should read the frontend image from the values maintained by the workflow, for example:

```yaml
services:
  frontend:
    image: ${FRONTEND_IMAGE}:${FRONTEND_TAG}
    restart: unless-stopped
```

The reverse proxy service should route browser traffic to the `frontend` service and expose `/healthz` from the Nginx container or proxy it unchanged.
