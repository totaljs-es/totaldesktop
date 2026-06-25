# TotalVM

Official image catalog for **TotalVM**, the macOS virtual machine manager for
Total.js developer environments.

The TotalVM app reads `index.json`, then each image's `manifest.json`, and shows
the official environments available to install. Images are published as RAW
disks compressed with zstd (`developer.raw.zst`) and attached to releases in
this repository.

## Layout

```
TotalVM/
  index.json                      list of available images
  developer-ubuntu/
    manifest.json                 image metadata
    icon.svg
  developer-arch/
    manifest.json
    icon.svg
```

Large artifacts are not committed to git. Each manifest's `download` points to a
GitHub Release asset in `totaljs-es/totaldesktop`.

## Official Images

- **Ubuntu LTS**: recommended for most developers who want a stable, familiar
  base for long-term work.
- **Arch Linux**: for more advanced Linux users who prefer a rolling base and
  newer packages.

Both images provide the same TotalVM desktop experience and Total.js workflow.
Choosing one is mostly about the Linux base you prefer.

## Catalog

```json
{
  "schema": 1,
  "name": "TotalVM Images",
  "images": [
    {
      "id": "developer-ubuntu",
      "name": "Total.js Developer (Ubuntu LTS)",
      "manifest": "developer-ubuntu/manifest.json",
      "official": true
    },
    {
      "id": "developer-arch",
      "name": "Total.js Developer (Arch)",
      "manifest": "developer-arch/manifest.json",
      "official": true
    }
  ]
}
```

## Manifest

```json
{
  "id": "developer-ubuntu",
  "name": "Total.js Developer (Ubuntu LTS)",
  "version": "1.0.0",
  "os": "ubuntu",
  "arch": "arm64",
  "format": "raw",
  "compression": "zstd",
  "memory": 4096,
  "cpus": 4,
  "disk": 40,
  "download": "https://github.com/totaljs-es/totaldesktop/releases/download/totalvm-developer-ubuntu-1.0.0/developer.raw.zst",
  "size": null,
  "sha256": null,
  "icon": "icon.svg",
  "description": "Recommended for most developers: a stable, familiar Total.js developer environment on Ubuntu LTS.",
  "author": "Total.js"
}
```

## Publishing a new version

1. Build the image with the TotalVM image builder.
2. Create a release in `totaljs-es/totaldesktop` tagged
   `totalvm-developer-ubuntu-<version>` or `totalvm-developer-arch-<version>`.
3. Attach the compressed image as:
   `developer.raw.zst`.
4. Update the matching `manifest.json` with `download`, `size` and `sha256`.
5. Update `index.json` if a new image is added.
