# Kaneo for Alqemist

This repository is Alqemist's fork of [Kaneo](https://github.com/usekaneo/kaneo), an open source project management tool released under the MIT license.

It builds on top of Kaneo and adds changes tailored to our internal usage.

## Added Features

- Gravatar fallback for members who have not uploaded a profile picture.
- Dedicated project labels view, with status-based statistics.
- Long label names wrap instead of being truncated on task cards.
- Product named Alqemist Tickets by default (instance name, emails, page titles, link previews).

## Development

```bash
pnpm install
pnpm dev
```

Local configuration follows Kaneo's setup: see `ENVIRONMENT_SETUP.md` for environment variables.

## Docker Image

The Dokploy-ready all-in-one image for this fork is published to GitHub Container Registry:

```text
ghcr.io/alqemist-labs/kaneo:latest
```

The image is built from `Dockerfile.kaneo` and published automatically on pushes to `main`. Version tags can also be published manually from the `Build & publish Docker image to GHCR` GitHub Actions workflow.

## Original README

The upstream Kaneo README (v2.48.0) is preserved here: [README.upstream.md](README.upstream.md).

## License

This fork remains based on Kaneo and its MIT license. See [LICENSE](LICENSE).
