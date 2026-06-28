// =====================================================================
// FIREBASE CONFIG — your real SuliManor Collection project keys.
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAqJ77BqU5aRkNG1OaMKCvvJv0wb0-WSM8",
  authDomain: "sulimanor-b0e1a.firebaseapp.com",
  projectId: "sulimanor-b0e1a",
  storageBucket: "sulimanor-b0e1a.firebasestorage.app",
  messagingSenderId: "311937522363",
  appId: "1:311937522363:web:740bceac42af0b6f02679e"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
