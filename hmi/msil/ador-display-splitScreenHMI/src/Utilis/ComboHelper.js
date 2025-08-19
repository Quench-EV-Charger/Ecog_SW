import { httpGet, httpPost } from "../services/servicesApi";
import { isSomeActive } from "../Utilis/UtilityFunction";

export const API_COMBO_SECC = (API) =>
  `${API}/controllers/1/api/stack-selection`;
export const API_COMBO_SECCLE = (API) =>
  `${API}/controllers/2/api/stack-selection`;

export const shouldResetCombo = (prevPath, path, chargerState) => {
  return prevPath !== "/" && path === "/" && !isSomeActive(chargerState);
};

export const resetCombo = async (API) => {
  // await httpPost(API_COMBO_SECC(API), 0, `chargingMode sent as 0 for SECC`); // prettier-ignore
  // await httpPost(API_COMBO_SECCLE(API), 0, `chargingMode sent as 0 for SECCLE`); // prettier-ignore
};

export const fetchCombo = async (API) => {
  return await httpGet(API_COMBO_SECC(API));
};

export const postCombo = async (selectedMode, API, publishChargingMode) => {
  publishChargingMode(selectedMode);
  await httpPost(API_COMBO_SECC(API), selectedMode, `chargingMode sent as ${selectedMode} for SECC`); // prettier-ignore
  await httpPost(API_COMBO_SECCLE(API), selectedMode, `chargingMode sent as ${selectedMode} for SECCLE`); // prettier-ignore
};
