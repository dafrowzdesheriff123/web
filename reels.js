const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const videoFile = document.getElementById("videoFile");
const uploadBtn = document.getElementById("uploadBtn");
const reelsContainer = document.getElementById("reelsContainer");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;

// Check login
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  loadReels();
});

// Upload reel
uploadBtn.addEventListener("click", async () => {
  const file = videoFile.files[0];
  if (!file) return alert("Select a video first!");

  const videoRef = storage.ref(`reels/${currentUser.uid}/${Date.now()}_${file.name}`);
  await videoRef.put(file);
  const videoURL = await videoRef.getDownloadURL();

  await db.collection("reels").add({
    userId: currentUser.uid,
    videoURL: videoURL,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  alert("Reel uploaded!");
  videoFile.value = "";
  loadReels();
});

// Load reels from all users
async function loadReels() {
  reelsContainer.innerHTML = "";
  const snapshot = await db.collection("reels").orderBy("createdAt", "desc").get();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const reel = document.createElement("div");
    reel.classList.add("reel");

    reel.innerHTML = `
      <video src="${data.videoURL}" autoplay muted loop></video>
      <div class="username">@${data.userId.slice(0, 5)}...</div>
    `;
    reelsContainer.appendChild(reel);
  });
}

// Logout
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "login.html";
});
