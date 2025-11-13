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

// ---- helper: determine expected payload ----
const getExpectedData = (config) => {
  const lightTheme = config?.branding?.brandingLogo?.lightTheme || "";
  const isMaruti = lightTheme.toLowerCase().includes("maruti");

  return {
    applications: {
      ui: isMaruti ? "build-maruti" : "build",
      scripts: [""]
    }
  };
};

// ---- helper: perform GET request ----
  const getCurrentConfig = async (apiEndpoint) => {
    try {
      const response = await fetch(apiEndpoint, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error(`GET failed with status ${response.status}`);
      const data = await response.json();
      console.log("✅ Current API Configuration:", data);
      return data;
    } catch (error) {
      console.log("⚠️ GET request error:", error);
      return null;
    }
  };

  // ---- helper: compare configs ----
  const isConfigMatching = (currentConfig, expectedData) => {
    const currentUi = currentConfig?.applications?.ui;
    const expectedUi = expectedData.applications.ui;
    return currentUi === expectedUi;
  };

  // ---- helper: perform POST request ----
  const postConfig = async (apiEndpoint, expectedData) => {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expectedData)
    });

    if (!response.ok) throw new Error(`POST failed: ${response.status} ${response.statusText}`);

    const result = await response.json();
    console.log("✅ POST Response:", result);
    return result;
  };

  // ---- main entry function ----
export const startupApiCall = async (config, apiEndpoint) => {
  try {
    // Wait 30 seconds before making the API call
    await new Promise((resolve) => setTimeout(resolve, 30000));

    const expectedData = getExpectedData(config);
    return await postConfig(apiEndpoint, expectedData);
  } catch (error) {
    console.error("❌ Error in startupApiCall:", error);
    throw error;
  }
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
  