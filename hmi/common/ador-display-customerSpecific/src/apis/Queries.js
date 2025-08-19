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
