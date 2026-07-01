const ANON_PATH = "anonymousPosts";
const UNLOCK_PASSWORD = "5731";
const UNLOCK_KEY = "anonUnlocked";

const anonForm = document.getElementById("anonForm");
const anonInput = document.getElementById("anonInput");
const anonList = document.getElementById("anonList");
const anonEmptyMsg = document.getElementById("anonEmptyMsg");
const anonErrorMsg = document.getElementById("anonErrorMsg");
const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("passwordInput");
const passwordErrorMsg = document.getElementById("passwordErrorMsg");
const unlockMsg = document.getElementById("unlockMsg");

const anonRef = db.ref(ANON_PATH);

let anonPosts = [];
let isUnlocked = sessionStorage.getItem(UNLOCK_KEY) === "true";

function showAnonError(message) {
  anonErrorMsg.textContent = message;
  anonErrorMsg.classList.remove("hidden");
}

function hideAnonError() {
  anonErrorMsg.textContent = "";
  anonErrorMsg.classList.add("hidden");
}

function showPasswordError(message) {
  passwordErrorMsg.textContent = message;
  passwordErrorMsg.classList.remove("hidden");
}

function hidePasswordError() {
  passwordErrorMsg.textContent = "";
  passwordErrorMsg.classList.add("hidden");
}

function updateUnlockUI() {
  unlockMsg.classList.toggle("hidden", !isUnlocked);
  passwordForm.classList.toggle("hidden", isUnlocked);
}

function renderAnon() {
  anonList.innerHTML = "";
  anonEmptyMsg.classList.toggle("hidden", anonPosts.length > 0);

  anonPosts.forEach((post) => {
    const li = document.createElement("li");
    li.className = "anon-item";

    const badge = document.createElement("span");
    badge.className = "anon-badge";
    badge.textContent = "익명";

    const content = document.createElement("div");
    content.className = "anon-content";

    const textSpan = document.createElement("span");
    textSpan.className = "anon-text" + (isUnlocked ? "" : " locked");
    textSpan.textContent = isUnlocked ? post.text : "비밀번호를 입력하면 내용을 볼 수 있어요";

    content.appendChild(textSpan);
    li.appendChild(badge);
    li.appendChild(content);
    anonList.appendChild(li);
  });
}

function addAnonPost(text) {
  const trimmed = text.trim();
  if (!trimmed) return Promise.resolve();

  return anonRef.push({
    text: trimmed,
    createdAt: Date.now(),
  });
}

function unlockContent(password) {
  if (password === UNLOCK_PASSWORD) {
    isUnlocked = true;
    sessionStorage.setItem(UNLOCK_KEY, "true");
    hidePasswordError();
    updateUnlockUI();
    renderAnon();
    return true;
  }

  showPasswordError("비밀번호가 올바르지 않습니다");
  return false;
}

anonForm.addEventListener("submit", (e) => {
  e.preventDefault();
  hideAnonError();

  addAnonPost(anonInput.value)
    .then(() => {
      anonInput.value = "";
      anonInput.focus();
    })
    .catch((error) => {
      console.error("익명 글 추가 오류:", error);
      showAnonError("글을 올리지 못했습니다. 잠시 후 다시 시도해주세요.");
    });
});

passwordForm.addEventListener("submit", (e) => {
  e.preventDefault();
  hidePasswordError();

  if (unlockContent(passwordInput.value.trim())) {
    passwordInput.value = "";
  }
});

updateUnlockUI();

anonRef.on(
  "value",
  (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      anonPosts = [];
    } else {
      anonPosts = Object.entries(data)
        .map(([id, post]) => ({
          id,
          text: post.text ?? "",
          createdAt: post.createdAt ?? 0,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
    }

    renderAnon();
  },
  (error) => {
    console.error("익명 게시판 연결 오류:", error);
    showAnonError("글을 불러오지 못했습니다.");
    anonEmptyMsg.textContent = "데이터를 불러오지 못했습니다.";
    anonEmptyMsg.classList.remove("hidden");
  }
);
