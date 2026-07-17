import { db } from "./firebase.js";
import { GEMINI_API_KEY } from "./config.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

let chatHistory = [];
let isFirstMessage = true;
let recognition = null;
let isListening = false;
let databaseLoaded = false;

let offers = [];
let alternatives = [];
let users = [];

const mic = document.getElementById("micButton");
const micButton = document.getElementById("micButton");
const usertext = document.getElementById("usertext");
const aitext = document.getElementById("aitext");
const status = document.getElementById("status");
const repeatBtn = document.getElementById("repeatBtn");
const offersBtn = document.getElementById("offersBtn");
const alternativeBtn = document.getElementById("alternativeBtn");
const clearBtn = document.getElementById("clearBtn");

window.addEventListener("load", async () => {
    await loadDatabase();
});

async function loadDatabase() {
    offers = await getOffers();
    alternatives = await getAlternatives();
    users = await getUsers();
    databaseLoaded = true;
    console.log("تم تحميل قاعدة البيانات");
}

micButton.addEventListener("click", () => {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    if (!isListening) {
        startlistening();
    }
});

function startlistening() {
    if (isListening) return;
    recognition = new webkitSpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    isListening = true;
    mic.classList.remove("thinking");
    mic.classList.add("listening");
    status.style.display = "block";
    status.innerHTML = "أنا أستمع إليك...";
    recognition.start();
    recognition.onresult = async function (event) {
        isListening = false;
        mic.classList.remove("listening");
        mic.classList.add("thinking");
        const text = event.results[0][0].transcript;
        console.log("Received text:", text);
        usertext.innerHTML = text;
        const reply = await askGemini(text);
        aitext.innerHTML = reply;
        speak(reply);
    };
    recognition.onspeechend = function () {
        mic.classList.remove("listening");
        mic.classList.add("thinking");
        status.innerHTML = "أفكر...";
    };
    recognition.onerror = function (event) {
        mic.classList.remove("listening");
        mic.classList.remove("thinking");
        mic.classList.remove("speaking");
        console.log(event.error);
        isListening = false;
        status.style.display = "block";
        status.innerHTML = "حدث خطأ في الميكروفون.";
    };
    recognition.onend = function () {
        mic.classList.remove("listening");
        isListening = false;
    };
}

async function getOffers() {
    console.log("بدأت قراءة قاعدة البيانات");
    const querySnapshot = await getDocs(collection(db, "Offers"));
    const data = [];
    querySnapshot.forEach((doc) => {
        data.push(doc.data());
    });
    console.log("عدد العروض:", data.length);
    return data;
}

console.log("Hi Firey! It's me! ...Leafy!");
async function getAlternatives() {
    console.log("بدأت قراءة البدائل");
    const querySnapshot = await getDocs(collection(db, "Alternatives"));
    const data = [];
    querySnapshot.forEach((doc) => {
        data.push(doc.data());
    });
    console.log("عدد البدائل:", data.length);
    return data;
}

async function getUsers() {
    console.log("بدأت قراءة المستخدمين");
    const querySnapshot = await getDocs(collection(db, "The user"));
    const data = [];
    querySnapshot.forEach((doc) => {
        data.push(doc.data());
    });
    console.log("عدد المستخدمين:", data.length);
    return data;
}


async function askGemini(userMessage) {
    if (!databaseLoaded) {
        return "انتظر قليلاً، ما زال التطبيق يحمّل البيانات.";
    }
    const databaseData = `
    العروض:
    ${JSON.stringify(offers, null, 2)}
    بدائل الأدوية:
    ${JSON.stringify(alternatives, null, 2)}
    بيانات المستخدم:
    ${JSON.stringify(users, null, 2)}
    `;
    let greeting = "";
    if (isFirstMessage) {
        greeting = `
هذه أول رسالة في المحادثة.
ابدأ بالترحيب بالمستخدم باسمه إذا وجدته في بيانات المستخدم.
عرّف بنفسك باختصار شديد.
بعدها أجب على السؤال.
`;
        isFirstMessage = false;
    }
    const prompt = `
${greeting}
أنت مساعد ذكي لمساعدة كبار السن والمكفوفين.
لا تستخدم Markdown أو رموز التنسيق مثل ** أو # أو *، واكتب كنص عربي عادي.
هدفك هو مساعدة المستخدم وليس فقط الإجابة على سؤاله.
إذا وجدت عرضاً مناسباً أو خصماً أو بديلاً مناسباً فأخبر المستخدم حتى لو لم يطلب ذلك.
إذا كانت المعلومات غير كافية فلا تخمن.
اسأل سؤالاً واحداً فقط ثم انتظر الإجابة.
إذا كان اسم المستخدم معروفاً فاستخدمه بشكل طبيعي.
إذا كان المستخدم كبير سن فاجعل الإجابة قصيرة وواضحة.
هذه هي قاعدة بيانات التطبيق بالكامل.
استخدمها عند الحاجة فقط.
لا تخترع أي معلومات غير موجودة فيها.
إذا لم تجد الإجابة في قاعدة البيانات فأخبر المستخدم بذلك.
قاعدة البيانات:
${databaseData}
المحادثة السابقة:
${chatHistory.map(item => `${item.role}: ${item.parts[0].text}`).join("\n")}
سؤال المستخدم:
${userMessage}
`;
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        }
    );
    const data = await response.json();
    console.log(data);
    if (!data.candidates) {
        console.log(data);
        return "تعذر الحصول على رد من Gemini.";
    }
    const reply = data.candidates[0].content.parts[0].text;
    chatHistory.push({
        role: "user",
        parts: [{
            text: userMessage
        }]
    });
    chatHistory.push({
        role: "model",
        parts: [{
            text: reply
        }]
    });
    if (chatHistory.length > 20) {
        chatHistory = chatHistory.slice(-20);
    }
    return reply;
}

repeatBtn.addEventListener("click", () => {
    if (aitext.innerHTML !== "") {
        speak(aitext.innerHTML);
    }
});

clearBtn.addEventListener("click", () => {
    chatHistory = [];
    isFirstMessage = true;
    usertext.innerHTML = "";
    aitext.innerHTML = "";
    status.innerHTML = "تم مسح المحادثة.";
});

async function sendQuickQuestion(question) {
    usertext.innerHTML = question;
    status.innerHTML = "أفكر...";
    const reply = await askGemini(question);
    aitext.innerHTML = reply;
    speak(reply);
}

function speak(text) {
    text = text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#/g, "")
    .replace(/`/g, "")
    .replace(/_/g, "")
    .replace(/>/g, "");
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    mic.classList.remove("thinking");
    mic.classList.add("speaking");
    speech.lang = "ar-SA";
    speech.rate = 1.25;
    speech.pitch = 1;
    status.style.display = "none";
    speech.onend = function () {
        mic.classList.remove("speaking");
        mic.classList.remove("speaking");
        status.style.display = "block";
        status.innerHTML = "بانتظارك...";
        if (!isListening) {
            startlistening();
        }
    };
    window.speechSynthesis.speak(speech);
}

offersBtn.addEventListener("click", async () => {
    await sendQuickQuestion(`
أريد معرفة العروض المناسبة لي.
اعرض لي أفضل العروض الموجودة في قاعدة البيانات، وإذا احتجت أي معلومة اسألني سؤالاً واحداً فقط.
`);
});
alternativeBtn.addEventListener("click", async () => {
    await sendQuickQuestion(`
أريد معرفة بديل دواء.
لا تخمن اسم الدواء.
ابدأ بسؤالي:
"ما اسم الدواء الذي تريد معرفة بديله؟"
ثم انتظر إجابتي وبعدها أكمل الحوار.
`);
});