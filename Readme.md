# Modrinth Pack to ZIP API

A simple API for converting Modrinth modpacks (.mrpack) to standard ZIP format.

## Overview

This API allows you to convert Modrinth modpacks (.mrpack files) to standard ZIP format programmatically. It supports two methods of conversion:

1. Using a Modrinth project ID to convert the latest version of a modpack
2. Using a direct URL to a .mrpack file

The conversion happens in the browser and the resulting ZIP file is automatically downloaded.

## API Usage

### Converting by Project ID

```
https://your-domain.com/?project=<project_id>
```

Example:
```
https://your-domain.com/?project=1KVo5zza
```

This will convert the latest version of the specified Modrinth project (in this example, Fabulously Optimized).

### Converting by URL

```
https://your-domain.com/?url=<mrpack_url>
```

Example:
```
https://your-domain.com/?url=https://cdn.modrinth.com/data/example/versions/1.0.0/example-1.0.0.mrpack
```

This will convert the specific .mrpack file from the provided URL.

### Using with curl or wget

To download the converted file directly using curl or wget, add the `raw=true` parameter:

```
curl -L "https://your-domain.com/?project=<project_id>&raw=true" -o modpack.zip
```

or

```
curl -L "https://your-domain.com/?url=<mrpack_url>&raw=true" -o modpack.zip
```

Example:
```
curl -L "https://your-domain.com/?project=1KVo5zza&raw=true" -o fabulously-optimized.zip
```

The `-L` flag is important as it tells curl to follow redirects, which is necessary for the download to work properly.

## Limitations

- Due to CORS restrictions, some mods hosted outside of Modrinth may not download properly
- GitHub-hosted files will open in a new tab and need to be manually added to the mods folder

## Credits

Based upon https://codeberg.org/jamie/mrpack-to-zip
