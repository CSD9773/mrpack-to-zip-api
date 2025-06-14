// Pure API for converting Modrinth modpacks to ZIP format
// No GUI elements, just conversion functionality

// Constants for Modrinth API
const mrApi = "https://api.modrinth.com/v2/project/";
const mrApiGetVersions = "/version";

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const urlParam = urlParams.get('url');
const projectParam = urlParams.get('project');
const rawParam = true; // Always use raw mode for API

// Process URL parameters on page load
document.addEventListener('DOMContentLoaded', function() {
  // Clear the document body - we don't need any UI elements
  document.body.innerHTML = '';
  document.body.style.padding = '0';
  document.body.style.margin = '0';

  if (urlParam != null) {
    downloadPack(urlParam);
  } else if (projectParam != null) {
    downloadLatestPack(projectParam);
  } else {
    // No parameters provided, show simple API usage message
    document.body.textContent = 'API Usage: ?project=<projectid> or ?url=<url modpack>';
  }
});

// Download pack from project ID
async function downloadLatestPack(id) {
  try {
    const response = await fetch(mrApi + id + mrApiGetVersions);

    if (!response.ok) {
      const errorMsg = "Invalid project ID or server error!";
      console.error(errorMsg);
      document.body.textContent = errorMsg;
      return;
    }

    let data = await response.json();

    if (data == null) {
      const errorMsg = "Invalid project ID!";
      console.error(errorMsg);
      document.body.textContent = errorMsg;
      return;
    } else if (data[0].files[0].url == null) {
      const errorMsg = "No files found!";
      console.error(errorMsg);
      document.body.textContent = errorMsg;
      return;
    }

    downloadPack(data[0].files[0].url);
  } catch (error) {
    const errorMsg = "An unknown error occurred: " + error.message;
    console.error(errorMsg);
    document.body.textContent = errorMsg;
  }
}

// Download pack from URL
function downloadPack(url) {
  if (url.includes("modpack")) {
    const errorMsg = "Please use the direct mrpack download URL, not the version page!";
    console.error(errorMsg);
    document.body.textContent = errorMsg;
    return;
  } else if (!url.includes("mrpack")) {
    const errorMsg = "That is not a valid mrpack URL.";
    console.error(errorMsg);
    document.body.textContent = errorMsg;
    return;
  }

  // Log status to console
  console.log("Downloading modpack...");

  JSZipUtils.getBinaryContent(url, function (err, data) {
    if (err) {
      const errorMsg = "Error downloading modpack: " + err.message;
      console.error(errorMsg);
      document.body.textContent = errorMsg;
      return;
    }

    downloadPackData(data);
  });
}

// Process the modpack data
function downloadPackData(data) {
  if (data.length <= 0) {
    const errorMsg = "Empty modpack data";
    console.error(errorMsg);
    document.body.textContent = errorMsg;
    return;
  }

  // Log status to console
  console.log("Converting modpack...");

  // Start creating a new zip file
  var newZip = new JSZip();

  // Read the zip file, so we can read the manifest
  JSZip.loadAsync(data)
    .then(async function (zip) {
      try {
        // Read the manifest
        const manifestRaw = await zip.files['modrinth.index.json'].async('string');
        const manifest = JSON.parse(manifestRaw);

        // Process overrides
        for (const fileName in zip.files) {
          const file = zip.files[fileName];
          if (file.dir) {
            continue;
          }

          if (file.name.startsWith("overrides/")) {
            const properFileName = file.name.substring("overrides/".length);
            newZip.file(properFileName, file.async('blob'));
          }

          if (file.name.startsWith("client-overrides/")) {
            const properFileName = file.name.substring("client-overrides/".length);
            newZip.file(properFileName, file.async('blob'));
          }
        }

        // Log status to console
        console.log("Downloading mod files...");

        // Download all mod files
        const filePromises = [];
        for (const fileIndex in manifest.files) {
          const file = manifest.files[fileIndex];

          // Skip GitHub files as they can't be automatically downloaded in API mode
          if (!file.downloads[0].includes("github.com")) {
            // Create a promise for each file download and add it to the array
            const downloadPromise = fetch(file.downloads[0])
              .then(function (f) {
                return f.blob();
              })
              .then(function (blob) {
                // Add the file to the zip
                newZip.file(file.path, blob);
                return blob; // Return the blob to indicate completion
              });

            filePromises.push(downloadPromise);
          }
        }

        // Wait for all downloads to complete before proceeding
        await Promise.all(filePromises);

        // Log status to console
        console.log("Generating final zip file...");

        // Generate the final zip file
        newZip.generateAsync({
          type: "blob"
        }).then(function (content) {
          const filename = manifest['name'] + '-' + manifest['versionId'] + '.zip';

          // Set content type and disposition headers for download
          const contentTypeHeader = document.createElement('meta');
          contentTypeHeader.httpEquiv = 'Content-Type';
          contentTypeHeader.content = 'application/zip';
          document.head.appendChild(contentTypeHeader);

          const contentDispositionHeader = document.createElement('meta');
          contentDispositionHeader.httpEquiv = 'Content-Disposition';
          contentDispositionHeader.content = 'attachment; filename="' + filename + '"';
          document.head.appendChild(contentDispositionHeader);

          // Create a blob URL for the download
          const blobUrl = URL.createObjectURL(content);

          // Redirect to the blob URL to trigger download
          window.location.href = blobUrl;
        });
      } catch (error) {
        const errorMsg = "Error processing modpack: " + error.message;
        console.error(errorMsg);
        document.body.textContent = errorMsg;
      }
    });
}
