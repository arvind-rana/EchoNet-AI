// Helper to build ImageKit transformation URLs
export const buildTransformationUrl = (src, transformations = []) => {
  if (!transformations.length) return src;

  // Convert transformation objects to URL parameters
  const transformParams = transformations
    .map((transform) => {
      const params = [];

      // Handle resizing transformations
      if (transform.width) params.push(`w-${transform.width}`);
      if (transform.height) params.push(`h-${transform.height}`);
      if (transform.focus) params.push(`fo-${transform.focus}`);
      if (transform.cropMode) params.push(`cm-${transform.cropMode}`);

      // Handle effects
      if (transform.effect) params.push(`e-${transform.effect}`);

      // Handle background
      if (transform.background) params.push(`bg-${transform.background}`);

      // Handle text overlays using layer syntax
      if (transform.overlayText) {
        const layerParams = [
          `l-text`,
          `i-${encodeURIComponent(transform.overlayText)}`,
          `tg-bold`,
          `lx-20,ly-20`,
        ];

        if (transform.overlayTextFontSize)
          layerParams.push(`fs-${transform.overlayTextFontSize}`);
        if (transform.overlayTextColor)
          layerParams.push(`co-${transform.overlayTextColor}`);
        if (transform.gravity) {
          // Map common gravity values to ImageKit positioning
          const gravityMap = {
            center: "center",
            north_west: "top_left",
            north_east: "top_right",
            south_west: "bottom_left",
            south_east: "bottom_right",
            north: "top",
            south: "bottom",
            west: "left",
            east: "right",
          };
          const mappedGravity =
            gravityMap[transform.gravity] || transform.gravity;
          layerParams.push(`lfo-${mappedGravity}`);
        }
        if (transform.overlayTextPadding)
          layerParams.push(`pa-${transform.overlayTextPadding}`);
        if (transform.overlayBackground)
          layerParams.push(`bg-${transform.overlayBackground}`);

        layerParams.push("l-end");
        return layerParams.join(",");
      }

      return params.join(",");
    })
    .filter((param) => param.length > 0)
    .join(":");

  // Insert transformation parameters into URL
  if (src.includes("/tr:")) {
    // Already has transformations, append to existing
    return src.replace("/tr:", `/tr:${transformParams}:`);
  } else {
    // Add new transformations
    const urlParts = src.split("/");
    const fileIndex = urlParts.length - 1;
    urlParts.splice(fileIndex, 0, `tr:${transformParams}`);
    return urlParts.join("/");
  }
};

// Upload file to ImageKit using your server-side API
export const uploadToImageKit = async (file, fileName) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName);

    const response = await fetch("/api/imagekit/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Upload failed");
    }

    const result = await response.json();

    return {
      success: true,
      data: {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        width: result.width,
        height: result.height,
        size: result.size,
      },
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

//1️⃣ buildTransformationUrl

// This function dynamically builds ImageKit URLs with transformations. 
// It takes an image URL and an array of transformation objects — like resizing, cropping, background, effects, or overlay text. 
// It converts each transformation into the correct ImageKit URL parameters, handles multiple transformations, 
// encodes overlay text properly, and intelligently inserts them into the URL. 
// It also handles edge cases like URLs that already have transformations and empty transformation objects. 
//This lets us generate optimized image URLs on the fly without modifying the original image."


// 2️⃣ uploadToImageKit

// "This function uploads a file to ImageKit via a server-side API endpoint. 
// It uses FormData to send the file and filename as a POST request. 
// Using async/await, it waits for the server response, handles errors if the upload fails,
//  and returns a structured object containing file metadata like URL, width, height, and size. 
// We upload through the server to keep API keys secure, prevent unauthorized access, 
// and safely handle file uploads. It’s also easily extensible to support compression, progress tracking, or error logging."