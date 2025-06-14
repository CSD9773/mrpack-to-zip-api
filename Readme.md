# Modrinth Pack to ZIP API

A pure API for converting Modrinth modpacks (.mrpack) to standard ZIP format.

## Overview

This API allows you to convert Modrinth modpacks (.mrpack files) to standard ZIP format programmatically. It supports two methods of conversion:

1. Using a Modrinth project ID to convert the latest version of a modpack
2. Using a direct URL to a .mrpack file

The conversion happens in the browser and the resulting ZIP file is automatically downloaded.

## API Usage

### Converting by Project ID

```
https://csd9773.github.io/mrpack-to-zip-api/?project=<project_id>
```

Example:
```
https://csd9773.github.io/mrpack-to-zip-api/?project=cobblemon-fabric
```

This will convert the latest version of the specified Modrinth project and download it as a ZIP file.

### Converting by URL

```
https://csd9773.github.io/mrpack-to-zip-api/?url=<mrpack_url>
```

Example:
```
https://csd9773.github.io/mrpack-to-zip-api/?url=https://cdn.modrinth.com/data/example/versions/1.0.0/example-1.0.0.mrpack
```

This will convert the specific .mrpack file from the provided URL and download it as a ZIP file.

### Using with curl or wget

To download the converted file directly using curl or wget:

```
curl -L "https://csd9773.github.io/mrpack-to-zip-api/?project=<project_id>" -o modpack.zip
```

or

```
curl -L "https://csd9773.github.io/mrpack-to-zip-api/?url=<mrpack_url>" -o modpack.zip
```

Example:
```
curl -L "https://csd9773.github.io/mrpack-to-zip-api/?project=cobblemon-fabric" -o modpack.zip
```

Important notes for curl/wget usage:
- The `-L` flag is essential as it tells curl to follow redirects
- The conversion process may take some time depending on the modpack size
- For large modpacks, consider using a longer timeout with curl: `--max-time 300` (5 minutes)
- If you encounter issues, try adding `--connect-timeout 60` to increase the connection timeout

Example with extended timeouts:
```
curl -L --max-time 300 --connect-timeout 60 "https://csd9773.github.io/mrpack-to-zip-api/?project=cobblemon-fabric" -o modpack.zip
```

## Limitations

- Due to CORS restrictions, some mods hosted outside of Modrinth may not download properly
- GitHub-hosted files are skipped in the conversion process
- The API is designed for programmatic use and has no web interface

## Credits

Based upon https://codeberg.org/jamie/mrpack-to-zip
