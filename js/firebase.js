import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };