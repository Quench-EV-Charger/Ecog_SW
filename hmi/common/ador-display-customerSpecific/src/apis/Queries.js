export const httpGet = async (url, errorLog) => {
  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.log(errorLog, error);
    });
};

export const httpPost = async (url, body, successLog) => {
  console.log('post', url, body);
  try {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    let requestOptions = {
      method: "POST",
      headers: myHeaders,
      body,
    };

    const response = await fetch(url, requestOptions);
    const result = await response.json();
    if (response.status === 200) {
      console.log(successLog, result);
    }
    return result;
  } catch (error) {
    console.log("error", error);
  }
};

export const startupApiCall = async (config) => {
  try {
    // Check if lightTheme contains "maruti"
    const lightTheme = (config && config.branding && config.branding.brandingLogo && config.branding.brandingLogo.lightTheme) || "";
    const isMaruti = lightTheme.toLowerCase().includes("maruti");
    
    // Determine expected payload based on lightTheme content
    const expectedData = {
      applications: {
        ui: isMaruti ? "build-maruti" : "build",
        scripts: [""]
      }
    };

    // API endpoint
    const apiEndpoint = config.API + "/store/charger-config";

    // First, check current configuration with GET request
    try {
      const getResponse = await fetch(apiEndpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (getResponse.ok) {
        const currentConfig = await getResponse.json();
        console.log("✅ Current API Configuration:", currentConfig);
        
        // Compare current configuration with expected configuration
        const currentUi = (currentConfig && currentConfig.applications && currentConfig.applications.ui);
        const expectedUi = expectedData.applications.ui;
        
        if (currentUi === expectedUi) {
          console.log("✅ Configuration already matches expected setting. Skipping POST API call.");
          return currentConfig;
        } else {
          console.log("🔄 Configuration mismatch detected. Current: " + currentUi + ", Expected: " + expectedUi + ". Proceeding with POST API call.");
        }
      } else {
        console.log("⚠️ GET request failed, proceeding with POST API call.");
      }
    } catch (getError) {
      console.log("⚠️ GET request error:", getError, "Proceeding with POST API call.");
    }

    // Execute POST API call if there's a mismatch or GET failed
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(expectedData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ POST Response:", result);
      return result;
    } else {
      throw new Error("HTTP " + response.status + ": " + response.statusText);
    }
  } catch (error) {
    console.log("❌ Error:", error);
    throw error;
  }
};
