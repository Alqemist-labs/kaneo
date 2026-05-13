# Kaneo for Alqemist

This repository is Alqemist's fork of [Kaneo](https://github.com/usekaneo/kaneo), an open source project management tool released under the MIT license.

It builds on top of Kaneo and adds changes tailored to our internal usage. Some of the changes currently present in this working tree have not been committed yet.

## Added Features

- Custom user avatars, with upload, removal, and display across the app.
- Workspace-level activity feed.
- Dedicated project labels view, with status-based statistics.
- Label and filter improvements across board, backlog, gantt, search, and task views.
- Seed data to make the activity feed easier to demo.

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

The previous upstream README is preserved here: [README.upstream.md](README.upstream.md).

## License

This fork remains based on Kaneo and its MIT license. See [LICENSE](LICENSE).
