const DEFAULT_USERNAME = "AbuFahd2763";
const DEFAULT_PASSWORD = "222033&Ibrahim";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("errorMessage");

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputUser = usernameInput.value.trim();
        const inputPass = passwordInput.value;

        if (inputUser === DEFAULT_USERNAME && inputPass === DEFAULT_PASSWORD) {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("username", inputUser);

            errorMessage.style.color = "var(--success)";
            errorMessage.style.borderRightColor = "var(--success)";
            errorMessage.style.backgroundColor = "#F4FBF7";
            errorMessage.innerText = "جاري تسجيل الدخول بنجاح...";
            errorMessage.style.display = "block";

            setTimeout(() => {
                window.location.href = "index.html"; 
            }, 600);

        } else {
            errorMessage.style.color = "var(--danger)";
            errorMessage.style.borderRightColor = "var(--danger)";
            errorMessage.style.backgroundColor = "#FFF8F8";
            errorMessage.innerText = "اسم المستخدم أو كلمة المرور غير صحيحة!";
            errorMessage.style.display = "block";
            
            usernameInput.style.borderColor = "var(--danger)";
            passwordInput.style.borderColor = "var(--danger)";

            const resetBorders = () => {
                usernameInput.style.borderColor = "";
                passwordInput.style.borderColor = "";
                errorMessage.style.display = "none";
            };
            usernameInput.addEventListener("input", resetBorders, { once: true });
            passwordInput.addEventListener("input", resetBorders, { once: true });
        }
    });
});