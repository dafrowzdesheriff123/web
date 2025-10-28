const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const videoFile = document.getElementById("videoFile");
const uploadBtn = document.getElementById("uploadBtn");
const reelsContainer = document.getElementById("reelsContainer");
const logoutBtn = document.getElementById("logoutBtn");
const profileBtn = document.getElementById("profileBtn");

let currentUser = null;

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUser = user;
  loadReels();
});

uploadBtn.addEventListener("click", async () => {
  const file = videoFile.files[0];
  if (!file) return alert("Select a video first!");

  const videoRef = storage.ref(`reels/${currentUser.uid}/${Date.now()}_${file.name}`);
  await videoRef.put(file);
  const videoURL = await videoRef.getDownloadURL();

  await db.collection("reels").add({
    userId: currentUser.uid,
    videoURL: videoURL,
    likes: [],
    views: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  alert("Reel uploaded!");
  videoFile.value = "";
  loadReels();
});

async function loadReels() {
  reelsContainer.innerHTML = "";
  const snapshot = await db.collection("reels").orderBy("createdAt", "desc").get();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const reel = document.createElement("div");
    reel.classList.add("reel");

    reel.innerHTML = `
      <video src="${data.videoURL}" muted loop></video>
      <div class="username">@${data.userId.slice(0, 5)}</div>
      <div class="reel-actions">
        <button class="like-btn">❤️</button>
        <span class="count">${data.likes?.length || 0}</span>
        <button class="view-btn">👁️</button>
        <span class="count">${data.views || 0}</span>
      </div>
    `;

    const video = reel.querySelector("video");
    const likeBtn = reel.querySelector(".like-btn");
    const viewBtn = reel.querySelector(".view-btn");

    // Play video on scroll into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          video.play();
          increaseViewCount(doc.id);
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.8 });
    observer.observe(video);

    // Like button
    likeBtn.addEventListener("click", async () => {
      const ref = db.collection("reels").doc(doc.id);
      const alreadyLiked = data.likes.includes(currentUser.uid);

      if (alreadyLiked) {
        await ref.update({
          likes: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
        });
      } else {
        await ref.update({
          likes: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
        });
      }
      loadReels();
    });

    reelsContainer.appendChild(reel);
  });
}

async function increaseViewCount(id) {
  const ref = db.collection("reels").doc(id);
  await ref.update({
    views: firebase.firestore.FieldValue.increment(1)
  });
}

logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "login.html";
});

profileBtn.addEventListener("click", () => {
  window.location.href = "profile.html";
});
