const KEY = "memi_ui_settings";

export function getUISetting(name, defaultValue = true) {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "{}");
    return name in stored ? stored[name] : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setUISetting(name, value) {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "{}");
    stored[name] = value;
    localStorage.setItem(KEY, JSON.stringify(stored));
    window.dispatchEvent(new Event("ui-settings-changed"));
  } catch {}
}