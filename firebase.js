const firebaseConfig = {
  apiKey: "AIzaSyC5g3kBIdR2bvnqHYJ_ItAJG5a5ZSPDdvA",
  authDomain: "minsun-todo-backend.firebaseapp.com",
  projectId: "minsun-todo-backend",
  storageBucket: "minsun-todo-backend.firebasestorage.app",
  messagingSenderId: "344559726345",
  appId: "1:344559726345:web:671e9f2f4810d736472dd8",
  databaseURL: "https://minsun-todo-backend-default-rtdb.firebaseio.com",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
