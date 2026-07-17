import { GEMINI_API_KEY } from "./config.js";
import { MAPS_API_KEY } from "./config.js";
import { PLACES_API_KEY } from "./config.js";
import { GEOCODING_API_KEY } from "./config.js";


document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }

    const chatHistory = document.getElementById("chatHistory");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");

    const recommendationCard = document.getElementById("recommendationCard");
    const placeName = document.getElementById("placeName");
    const placeDetails = document.getElementById("placeDetails");
    const placePrice = document.getElementById("placePrice");
    const placeDistance = document.getElementById("placeDistance");

    let map;
    let userMarker;
    let recommendationMarker;

    // موقع افتراضي ثابت (برج المملكة بالرياض)
    let userLocation = {
        lat: 24.7117, 
        lng: 46.6744
    };

    function loadGoogleMaps() {
        if (typeof google !== "undefined" && google.maps) {
            initMapProcess();
            return;
        }
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            initMapProcess();
        };
        script.onerror = () => {
            console.error("فشل تحميل كود جوجل ماب الخارجي!");
            addMessage("ai", "حدث خطأ أثناء تحميل نظام الخرائط. يرجى التحقق من المفاتيح.");
        };
        document.head.appendChild(script);
    }

    function initMapProcess() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    initMap(userLocation);
                },
                () => {
                    initMap(userLocation); 
                }
            );
        } else {
            initMap(userLocation);
        }
    }

    function initMap(location) {
        map = new google.maps.Map(document.getElementById("map"), {
            center: location,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        });

        userMarker = new google.maps.Marker({
            position: location,
            map: map,
            title: "موقعك الحالي"
        });
    }

    function addMessage(sender, text) {
        const box = document.createElement("div");
        box.className = sender === "user" ? "user-message" : "ai-message";
        box.innerHTML = `
            <h3>${sender === "user" ? "أنت" : "نديم"}</h3>
            <p>${text}</p>
        `;
        chatHistory.appendChild(box);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // 3. تحليل النتائج الفعالة واختيار المكان الأفضل
    async function getGeminiRecommendation(userQuery, placesList) {
        const placesSummary = placesList.slice(0, 5).map(p => ({
            name: p.name,
            address: p.vicinity,
            rating: p.rating || "غير متوفر",
            priceLevel: p.price_level !== undefined ? p.price_level : "غير محدد",
            lat: p.geometry.location.lat(),
            lng: p.geometry.location.lng()
        }));

        const prompt = `
        أنت المساعد الذكي "نديم" وتتحدث بلغة عربية ودودة ولطيفة وجذابة وتراعي حاجة العميل.
        المستخدم سأل: "${userQuery}".
        لديك هذه المواقع القريبة الحقيقية التي وجدناها حوله: ${JSON.stringify(placesSummary)}.
        
        اختر أفضل مكان يناسبه (الأقرب، أو الأعلى تقييماً، أو الأفضل لحل مشكلته فورا).
        قم بصياغة الرد على شكل كائن JSON دقيق فقط دون أي نصوص خارجية أو علامات Markdown مثل \`\`\`json.
        بنية الرد المطلوبة:
        {
          "reason": "رد ودود منك للمستخدم يشرح سبب اختيار هذا المكان المحدد لحل مشكلته ومقارنة سريعة لصالحه ليرتاح لاختيارك بأسلوب نديم اللطيف والمقنع للغاية",
          "selectedIndex": 0,
          "estimatedPrice": "رخيص وموفر / متوسط التكلفة / مرتفع التكلفة",
          "distance": "تقدير المسافة تقريبا مثل 1.5 كم"
        }
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            let textResponse = data.candidates[0].content.parts[0].text.trim();
            
            // تنظيف أي علامات برمجية زائدة يضعها الذكاء الاصطناعي أحياناً
            textResponse = textResponse.replace(/^```json/, "").replace(/```$/, "").trim();
            
            console.log("=== رد Gemini النهائي بعد التحليل والتنظيف:", textResponse);
            return JSON.parse(textResponse);
        } catch (error) {
            console.error("فشل معالجة واختيار المكان بالـ JSON من Gemini:", error);
            return null;
        }
    }

    async function searchNearbyPlaces(originalQuery) {
        if (!map) {
            addMessage("ai", "عذراً، نظام الخرائط غير جاهز حالياً.");
            return;
        }

        const placeInfo = getPlaceType(originalQuery);
        if (!placeInfo) {
            addMessage("ai", "عذراً، لم أستطع تحديد نوع المكان المطلوب.");
            return;
        }

        console.log("نوع المكان:", placeInfo);

        const service = new google.maps.places.PlacesService(map);
        let request;
        if (placeInfo.type) {
            request = {
                location: userLocation,
                radius: 50000,
                type: placeInfo.type
            };
        
        } else {
            request = {
                location: userLocation,
                radius: 50000,
                keyword: placeInfo.keyword
            };
        }

        console.log(request);
        service.nearbySearch(request, async (results, status) => {
            console.log("=== حالة البحث في جوجل ماب (Status):", status);
            console.log("=== عدد النتائج التي تم العثور عليها:", results ? results.length : 0);

            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                const aiResult = await getGeminiRecommendation(originalQuery, results);

                if (aiResult && results[aiResult.selectedIndex]) {
                    const bestPlace = results[aiResult.selectedIndex];
                    const targetLatLng = bestPlace.geometry.location;
                    
                    map.setCenter(targetLatLng);
                    map.setZoom(16);

                    if (recommendationMarker) {
                        recommendationMarker.setMap(null);
                    }

                    recommendationMarker = new google.maps.Marker({
                        position: targetLatLng,
                        map: map,
                        title: bestPlace.name,
                        animation: google.maps.Animation.DROP
                    });

                    addMessage("ai", aiResult.reason);

                    placeName.textContent = bestPlace.name;
                    placeDetails.textContent = bestPlace.vicinity || "لا توجد تفاصيل للعنوان";
                    placePrice.textContent = `💰 ${aiResult.estimatedPrice || "اقتصادي"}`;
                    placeDistance.textContent = `📍 ${aiResult.distance || "قريب منك"}`;
                    recommendationCard.style.display = "flex";

                } else {
                    console.log("حدث خطأ في ترجيح Gemini، جاري الانتقال للحل الاحتياطي التلقائي...");
                    fallbackSelection(results[0]);
                }
            } else {
                console.warn("جوجل ماب لم يجد أي نتائج مطابقة للكلمة المستخرجة!");
                addMessage("ai", `بحثت لك حول موقعك ولكن لم أجد أماكن مناسبة في محيط 50 كم.`);
            }
        });
    }

    function fallbackSelection(place) {
        const targetLatLng = place.geometry.location;
        map.setCenter(targetLatLng);
        
        if (recommendationMarker) {
            recommendationMarker.setMap(null);
        }

        recommendationMarker = new google.maps.Marker({
            position: targetLatLng,
            map: map,
            title: place.name,
            animation: google.maps.Animation.DROP
        });

        addMessage("ai", `بحثت لك ووجدت هذا المكان كأقرب خيار متوفر حولك: "${place.name}". تم تحديده على الخريطة.`);
        
        placeName.textContent = place.name;
        placeDetails.textContent = place.vicinity || "";
        placePrice.textContent = "💰 معتدل التكلفة";
        placeDistance.textContent = "📍 قريب";
        recommendationCard.style.display = "flex";
    }

    function handleSend() {
        const query = userInput.value.trim();
        if (!query) return;

        addMessage("user", query);
        userInput.value = "";

        addMessage("ai", "أقوم حالياً بتحليل كلماتك لاستخراج نوع المكان المناسب، والبحث عنه حولك ومقارنة الأسعار بذكاء...");
        searchNearbyPlaces(query);
    }

    sendBtn.addEventListener("click", handleSend);

    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    loadGoogleMaps();
});