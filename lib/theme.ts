// Dark ("graphite") is the default on :root; Paper is opt-in via .paper on <html>.
// The app does not follow the OS theme; the visitor's choice is remembered in localStorage.
export const THEME_KEY = "metamap.theme";

export type Theme = "dark" | "paper";

// Runs in <head> before first paint so a saved Paper choice never flashes dark.
export const themeScript = `(function(){try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="paper")document.documentElement.classList.add("paper")}catch(e){}})()`;
