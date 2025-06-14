// API version of converter.js without GUI elements
// This script handles modpack conversion via URL parameters

// Constants for Modrinth API
const mrApi = "https://api.modrinth.com/v2/project/";
const mrApiGetVersions = "/version";

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const urlParam = urlParams.get('url');
const projectParam = urlParams.get('project');
const rawParam = urlParams.get('raw') === 'true';

// Process URL parameters on page load
document.addEventListener('DOMContentLoaded', function() {
  // If raw mode is enabled, hide all UI elements
  if (rawParam) {
    document.body.innerHTML = '';
    document.body.style.padding = '0';
    document.body.style.margin = '0';
  }

  if (urlParam != null) {
    downloadPack(urlParam);
  } else if (projectParam == 'fo') {
    window.location.href = "https://download.fo/vanilla?download=latest";
  } else if (projectParam != null) {
    downloadLatestPack(projectParam);
  } else {
    // No parameters provided, show API usage information
    if (!rawParam) {
      document.getElementById('api-info').style.display = 'block';
    }
  }
});

// Download pack from project ID
async function downloadLatestPack(id) {
  try {
    const response = await fetch(mrApi + id + mrApiGetVersions);

    if (!response.ok) {
      const errorMsg = "Invalid project ID or server error!";
      console.error(errorMsg);
      if (!rawParam) {
        document.getElementById('error-message').textContent = errorMsg;
        document.getElementById('error-message').style.display = 'block';
      } else {
        document.body.textContent = errorMsg;
      }
      return;
    }

    let data = await response.json();

    if (data == null) {
      const errorMsg = "Invalid project ID!";
      console.error(errorMsg);
      if (!rawParam) {
        document.getElementById('error-message').textContent = errorMsg;
        document.getElementById('error-message').style.display = 'block';
      } else {
        document.body.textContent = errorMsg;
      }
      return;
    } else if (data[0].files[0].url == null) {
      const errorMsg = "No files found!";
      console.error(errorMsg);
      if (!rawParam) {
        document.getElementById('error-message').textContent = errorMsg;
        document.getElementById('error-message').style.display = 'block';
      } else {
        document.body.textContent = errorMsg;
      }
      return;
    }

    downloadPack(data[0].files[0].url);
  } catch (error) {
    const errorMsg = "An unknown error occurred: " + error.message;
    console.error(errorMsg);
    if (!rawParam) {
      document.getElementById('error-message').textContent = errorMsg;
      document.getElementById('error-message').style.display = 'block';
    } else {
      document.body.textContent = errorMsg;
    }
  }
}

// Download pack from URL
function downloadPack(url) {
  if (url.includes("modpack")) {
    const errorMsg = "Please use the direct mrpack download URL, not the version page!";
    console.error(errorMsg);
    if (!rawParam) {
      document.getElementById('error-message').textContent = errorMsg;
      document.getElementById('error-message').style.display = 'block';
    } else {
      document.body.textContent = errorMsg;
    }
    return;
  } else if (!url.includes("mrpack")) {
    const errorMsg = "That is not a valid mrpack URL.";
    console.error(errorMsg);
    if (!rawParam) {
      document.getElementById('error-message').textContent = errorMsg;
      document.getElementById('error-message').style.display = 'block';
    } else {
      document.body.textContent = errorMsg;
    }
    return;
  }

  // Show download status
  const statusMsg = "Downloading modpack...";
  if (!rawParam) {
    document.getElementById('status-message').textContent = statusMsg;
    document.getElementById('status-message').style.display = 'block';
  }

  JSZipUtils.getBinaryContent(url, function (err, data) {
    if (err) {
      const errorMsg = "Error downloading modpack: " + err.message;
      console.error(errorMsg);
      if (!rawParam) {
        document.getElementById('error-message').textContent = errorMsg;
        document.getElementById('error-message').style.display = 'block';
      } else {
        document.body.textContent = errorMsg;
      }
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
    if (!rawParam) {
      document.getElementById('error-message').textContent = errorMsg;
      document.getElementById('error-message').style.display = 'block';
    } else {
      document.body.textContent = errorMsg;
    }
    return;
  }

  // Update status
  const convertingMsg = "Converting modpack...";
  if (!rawParam) {
    document.getElementById('status-message').textContent = convertingMsg;
  }

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

        // Update status
        const downloadingMsg = "Downloading mod files...";
        if (!rawParam) {
          document.getElementById('status-message').textContent = downloadingMsg;
        }

        // Download all mod files
        const filePromises = [];
        for (const fileIndex in manifest.files) {
          const file = manifest.files[fileIndex];

          if (file.downloads[0].includes("github.com")) {
            // GitHub files need to be downloaded manually
            if (!rawParam) {
              window.open(file.downloads[0], '_blank');
            }
          } else {
            newZip.file(file.path, fetch(file.downloads[0]).then(function (f) {
              return f.blob();
            }));
          }
        }

        // Update status
        const generatingMsg = "Generating final zip file...";
        if (!rawParam) {
          document.getElementById('status-message').textContent = generatingMsg;
        }

        // Generate the final zip file
        newZip.generateAsync({
          type: "blob"
        }).then(function (content) {
          const filename = manifest['name'] + '-' + manifest['versionId'] + '.zip';

          if (rawParam) {
            // For raw mode (curl downloads), create a data URL and redirect to it
            const reader = new FileReader();
            reader.onload = function() {
              // Set content type header for binary data
              const contentTypeHeader = document.createElement('meta');
              contentTypeHeader.httpEquiv = 'Content-Type';
              contentTypeHeader.content = 'application/zip';
              document.head.appendChild(contentTypeHeader);

              // Set content disposition header for filename
              const contentDispositionHeader = document.createElement('meta');
              contentDispositionHeader.httpEquiv = 'Content-Disposition';
              contentDispositionHeader.content = 'attachment; filename="' + filename + '"';
              document.head.appendChild(contentDispositionHeader);

              // Redirect to the data URL
              window.location.href = reader.result;
            };
            reader.readAsDataURL(content);
          } else {
            // Update status for browser mode
            document.getElementById('status-message').textContent = "Download complete!";

            // Trigger browser download
            saveAs(content, filename);
          }
        });
      } catch (error) {
        const errorMsg = "Error processing modpack: " + error.message;
        console.error(errorMsg);
        if (!rawParam) {
          document.getElementById('error-message').textContent = errorMsg;
          document.getElementById('error-message').style.display = 'block';
        } else {
          document.body.textContent = errorMsg;
        }
      }
    });
}
