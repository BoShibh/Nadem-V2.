document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }
    if (localStorage.getItem("largeText") === "true") {
        document.body.classList.add("large-text");
    }

    const language = localStorage.getItem("language") || "ar";

    if (language === "en") {
        document.documentElement.lang = "en";
    } else {
        document.documentElement.lang = "ar";
    }
});