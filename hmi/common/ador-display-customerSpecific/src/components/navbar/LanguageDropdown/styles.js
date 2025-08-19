export const LanguageDropdownIconContainer = {
  display: "flex",
  justifyContent: "center",
};

export const LanguageOptionContainer = (idx) => {
  return {
    borderTop: idx !== 0 && "1px solid #dbdbdb",
  };
};

export const LanguageOptionTextContainer = {
  padding: "1vw",
  margin: "0.5vw",
};

export const LanguageOptionText = {
  fontSize: "1.5vw",
  fontWeight: "bold",
};
