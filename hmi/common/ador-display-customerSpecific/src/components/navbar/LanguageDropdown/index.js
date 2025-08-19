import React from "react";
import { Dropdown, Menu } from "antd";

import CustomIcon from "../../CustomIcon";

import * as S from "./styles";

const LanguageChoices = (handleLanguageChange, currentLanguage, languages) => (
  <Menu data-testid="language-choices">
    {languages &&
      Array.isArray(languages) &&
      languages.map((language, idx) => (
        <Menu.Item
          key={language.key}
          onClick={() => handleLanguageChange(language)}
          disabled={currentLanguage === language.key}
          style={S.LanguageOptionContainer(idx)}
        >
          <div style={S.LanguageOptionTextContainer}>
            <span style={S.LanguageOptionText}>{language.displayValue}</span>
          </div>
        </Menu.Item>
      ))}
  </Menu>
);

export default function LanguageDropdown({
  theme,
  onClick,
  language,
  languages,
}) {
  return (
    <Dropdown
      overlay={() => LanguageChoices(onClick, language, languages)}
      trigger={["click"]}
      data-testid="language-dropdown"
    >
      <div className="ant-dropdown-link" data-testid="language-dropdown-link" style={S.LanguageDropdownIconContainer}>
        <CustomIcon fill={theme === "dark" ? "white" : "black"} />
      </div>
    </Dropdown>
  );
}
