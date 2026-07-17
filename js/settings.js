const settings = {
    darkMode: localStorage.getItem("darkMode") === "true",
    language: localStorage.getItem("language") || "ar",
    fontSize: localStorage.getItem("fontSize") || "medium",
    autoMic: localStorage.getItem("autoMic") !== "false",
    notifications: localStorage.getItem("notifications") !== "false"
};

document.addEventListener('DOMContentLoaded', () => {
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const voiceResponse = document.getElementById('voiceResponse');
    const language = document.getElementById('language');
    const notifications = document.getElementById('notifications');
    const largeText = document.getElementById('largeText');

    function applyDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    const isDarkSaved = localStorage.getItem('darkMode') === 'true';
    darkModeToggle.checked = isDarkSaved;
    applyDarkMode(isDarkSaved);

    voiceResponse.checked = localStorage.getItem('voiceResponse') !== 'false'; 
    language.value = localStorage.getItem('language') || "ar";
    notifications.checked =
    localStorage.getItem("notifications") !== "false";
    largeText.checked = localStorage.getItem('largeText') === 'true';

    darkModeToggle.addEventListener('change', (e) => {
        applyDarkMode(e.target.checked);
        localStorage.setItem('darkMode', e.target.checked);
    });

    voiceResponse.addEventListener('change', (e) => {
        localStorage.setItem('voiceResponse', e.target.checked);
    });

    language.addEventListener("change",(e)=>{
    localStorage.setItem("language",language.value);
    });


    notifications.addEventListener("change",(e)=>{
    localStorage.setItem("notifications",notifications.checked);
    });

    largeText.addEventListener('change', (e) => {
        localStorage.setItem('largeText', e.target.checked);
    });

    saveSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();

        localStorage.setItem('darkMode', darkModeToggle.checked);
        localStorage.setItem('voiceResponse', voiceResponse.checked);
        localStorage.setItem('language', language.value);
        localStorage.setItem('notifications', notifications.checked);
        localStorage.setItem('largeText', largeText.checked);

        const originalText = saveSettingsBtn.textContent;
        const originalBg = saveSettingsBtn.style.backgroundColor;
        const originalColor = saveSettingsBtn.style.color;

        saveSettingsBtn.textContent = 'تم حفظ الإعدادات وتطبيقها بنجاح! ✓';
        saveSettingsBtn.style.backgroundColor = '#4CAF50';
        saveSettingsBtn.style.color = '#FFFFFF';

        setTimeout(() => {
            saveSettingsBtn.textContent = originalText;
            saveSettingsBtn.style.backgroundColor = originalBg;
            saveSettingsBtn.style.color = originalColor;
        }, 2000);
    });
});