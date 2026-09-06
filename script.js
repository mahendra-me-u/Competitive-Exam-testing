// script.js - MCQ Practice Platform + NCSM 12 Subject Mock Tests

const firebaseConfig = {
  apiKey: "AIzaSyBfGRzd0zYLfDa2YFAFtsryTkD7jx4AXOM",
  authDomain: "mcq-platform-a08cc.firebaseapp.com",
  projectId: "mcq-platform-a08cc",
  storageBucket: "mcq-platform-a08cc.firebasestorage.app",
  messagingSenderId: "1028116014295",
  appId: "1:1028116014295:web:7bfc56b259d4f58be93c92"
};

/*
 * NCSM SUBJECTS
 * You can rename these 12 subjects here without changing the rest of the code.
 */
const NCSM_SUBJECTS = [
  "Mathematics",
  "Reasoning",
  "English",
  "Polity",
  "Economics",
  "Geography",
  "History",
  "Biology",
  "Chemistry",
  "Physics",
  "GK/CA",
  "1ST MOCK TEST"
];

let db = null;
let currentUser = null;
let currentQuiz = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let currentMode = "exam";
let currentCategory = "";
let currentSubject = "";

// ---------------- Firebase ----------------
async function initFirebase() {
  const status = document.getElementById("firebaseStatus");
  showScreen("loginScreen");
  try {
    if (typeof firebase === "undefined") throw new Error("Firebase SDK did not load.");
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    if (status) {
      status.textContent = "Firebase ready";
      status.className = "success-message";
      setTimeout(() => status.classList.add("hidden"), 1200);
    }
  } catch (e) {
    console.error("Firebase startup error:", e);
    db = null;
    if (status) {
      status.textContent = "Firebase could not be loaded. Check the Firebase CDN/configuration.";
      status.className = "error-message";
    }
  }
}

// ---------------- Helpers ----------------
function showScreen(screenId) {
  document.querySelectorAll(".container").forEach(el => el.classList.add("hidden"));
  const target = document.getElementById(screenId);
  if (target) target.classList.remove("hidden");
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
  }
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

function showSuccess(id, msg) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 4000);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------------- NCSM ----------------
function populateNcsmSubjects() {
  const grid = document.getElementById("ncsmSubjects");
  const select = document.getElementById("newSubject");

  if (grid) {
    grid.innerHTML = "";
    NCSM_SUBJECTS.forEach((subject, index) => {
      const card = document.createElement("div");
      card.className = "subject-card";
      card.innerHTML = `
        <div class="subject-number">${index + 1}</div>
        <h3>${escapeHtml(subject)}</h3>
        <p>NCSM Mock Test</p>
        <button class="btn btn-primary subject-btn">Start Test</button>
      `;
      card.querySelector("button").addEventListener("click", () => {
        startNcsmQuiz(subject);
      });
      grid.appendChild(card);
    });
  }

  if (select) {
    select.innerHTML = NCSM_SUBJECTS.map(s =>
      `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`
    ).join("");
  }
}

function openNcsm() {
  populateNcsmSubjects();
  showScreen("ncsmScreen");
}

async function startNcsmQuiz(subject) {
  currentCategory = "NCSM";
  currentSubject = subject;
  currentMode = "exam";

  try {
    const snap = await db.collection("questions")
      .where("category", "==", "NCSM")
      .where("subject", "==", subject)
      .get();

    if (snap.empty) {
      alert(`No questions have been added yet for "${subject}".\n\nAsk the admin to add questions for this subject.`);
      return;
    }

    currentQuiz = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    currentQuiz.sort(() => Math.random() - 0.5);

    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuiz.length).fill(null);

    document.getElementById("quizTitle").textContent = `NCSM • ${subject}`;
    document.getElementById("totalQuestions").textContent = currentQuiz.length;
    document.getElementById("prevBtn").style.display = "block";

    loadQuestion();
    showScreen("quizScreen");
  } catch (err) {
    alert("Error loading NCSM questions: " + err.message);
  }
}

// ---------------- Login / Signup ----------------
document.getElementById("showSignup")?.addEventListener("click", () => showScreen("signupScreen"));
document.getElementById("showLogin")?.addEventListener("click", () => showScreen("loginScreen"));

document.getElementById("signupForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  hideError("signupError");

  const name = document.getElementById("signupName").value.trim();
  const username = document.getElementById("signupUsername").value.trim().toLowerCase();
  const password = document.getElementById("signupPassword").value;

  if (!name || !username || !password) return;

  if (password.length < 4) {
    showError("signupError", "Password must be at least 4 characters");
    return;
  }
  if (!db) { showError("signupError", "Firebase is not connected. Refresh the page."); return; }

  try {
    const doc = await db.collection("users").doc(username).get();
    if (doc.exists) {
      showError("signupError", "Username already exists");
      return;
    }

    await db.collection("users").doc(username).set({
      username, password, name, isAdmin: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showSuccess("signupSuccess", "Account created! Please login.");
    e.target.reset();
    setTimeout(() => showScreen("loginScreen"), 1200);
  } catch (err) {
    showError("signupError", "Error: " + err.message);
  }
});

document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  hideError("loginError");
  const username = document.getElementById("loginUsername").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  if (!username || !password) { showError("loginError", "Username and password required"); return; }
  if (!db) { showError("loginError", "Firebase is not connected. Refresh the page and try again."); return; }
  const button = e.target.querySelector("button[type='submit']");
  const oldText = button ? button.textContent : "Login";
  try {
    if (button) { button.disabled = true; button.textContent = "Logging in..."; }
    let doc = await db.collection("users").doc(username).get();
    if (!doc.exists && username === "admin" && password === "admin123") {
      await db.collection("users").doc("admin").set({
        username: "admin", password: "admin123", name: "Administrator", isAdmin: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      doc = await db.collection("users").doc("admin").get();
    }
    if (!doc.exists || doc.data().password !== password) {
      showError("loginError", "Invalid username or password"); return;
    }
    currentUser = { id: username, ...doc.data() };
    if (currentUser.isAdmin) {
      await loadAdminPanel();
      showScreen("adminScreen");
    } else {
      document.getElementById("userName").textContent = currentUser.name || currentUser.username;
      showScreen("dashboardScreen");
    }
    e.target.reset();
  } catch (err) {
    console.error("Login error:", err);
    showError("loginError", err.code === "permission-denied" ? "Firestore permission denied. Check Firestore Rules." : "Login error: " + err.message);
  } finally {
    if (button) { button.disabled = false; button.textContent = oldText; }
  }
});

// ---------------- Normal Quiz ----------------
document.querySelectorAll(".practice-btn, .exam-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    startQuiz(btn.dataset.cat, btn.dataset.mode);
  });
});

async function startQuiz(category, mode = "exam") {
  currentCategory = category;
  currentSubject = "";
  currentMode = mode;

  try {
    const snap = await db.collection("questions")
      .where("category", "==", category)
      .get();

    if (snap.empty) {
      alert(`No questions found in category: ${category}`);
      return;
    }

    currentQuiz = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    currentQuiz.sort(() => Math.random() - 0.5);

    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuiz.length).fill(null);

    document.getElementById("quizTitle").textContent = category;
    document.getElementById("totalQuestions").textContent = currentQuiz.length;
    document.getElementById("prevBtn").style.display =
      mode === "practice" ? "none" : "block";

    loadQuestion();
    showScreen("quizScreen");
  } catch (err) {
    alert("Error loading questions: " + err.message);
  }
}

function loadQuestion() {
  const q = currentQuiz[currentQuestionIndex];
  if (!q) return;

  document.getElementById("currentQuestion").textContent =
    currentQuestionIndex + 1;
  document.getElementById("questionText").textContent = q.question;

  const container = document.getElementById("optionsContainer");
  container.innerHTML = "";

  const feedback = document.getElementById("feedback");
  feedback?.classList.add("hidden");

  q.options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = "option";
    if (userAnswers[currentQuestionIndex] === i) {
      div.classList.add("selected");
    }
    div.textContent = opt;
    div.onclick = () => selectOption(i);
    container.appendChild(div);
  });

  const nextBtn = document.getElementById("nextBtn");
  const isLast = currentQuestionIndex === currentQuiz.length - 1;

  nextBtn.textContent =
    currentMode === "practice" && !isLast
      ? "Next Question"
      : (isLast ? "Finish" : "Next");

  if (currentMode === "practice" &&
      userAnswers[currentQuestionIndex] !== null) {
    showFeedback();
  }
}

function selectOption(index) {
  userAnswers[currentQuestionIndex] = index;

  if (currentMode === "practice") {
    showFeedback();
  } else {
    loadQuestion();
  }
}

function showFeedback() {
  const q = currentQuiz[currentQuestionIndex];
  const userIdx = userAnswers[currentQuestionIndex];
  const correct = q.correct;
  const isCorrect = userIdx === correct;
  const fb = document.getElementById("feedback");

  if (!fb) return;

  fb.className =
    `feedback-panel ${isCorrect ? "feedback-correct" : "feedback-wrong"}`;

  fb.innerHTML = `
    <h4>${isCorrect ? "সঠিক উত্তর!" : "ভুল উত্তর!"}</h4>
    ${!isCorrect ? `<p><strong>সঠিক উত্তর:</strong> ${escapeHtml(q.options[correct])}</p>` : ""}
    <p><strong>ব্যাখ্যা:</strong><br>${escapeHtml(q.explanation || "No explanation available.")}</p>
  `;

  fb.classList.remove("hidden");
  document.querySelectorAll(".option").forEach(el => {
    el.style.pointerEvents = "none";
  });
}

document.getElementById("nextBtn")?.addEventListener("click", () => {
  if (currentQuestionIndex < currentQuiz.length - 1) {
    currentQuestionIndex++;
    loadQuestion();
  } else {
    finishQuiz();
  }
});

document.getElementById("prevBtn")?.addEventListener("click", () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    loadQuestion();
  }
});

// ---------------- Results / Review ----------------
async function finishQuiz() {
  let score = 0;

  currentQuiz.forEach((q, i) => {
    if (userAnswers[i] === q.correct) score++;
  });

  const percentage = Math.round((score / currentQuiz.length) * 100);

  try {
    await db.collection("results").add({
      username: currentUser.username,
      name: currentUser.name,
      category: currentCategory,
      subject: currentSubject || null,
      mode: currentMode,
      score,
      total: currentQuiz.length,
      percentage,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      date: new Date().toISOString()
    });

    document.getElementById("scoreDisplay").textContent =
      `${score} / ${currentQuiz.length}`;

    document.getElementById("resultMessage").textContent =
      percentage >= 80 ? "অসাধারণ!" :
      percentage >= 60 ? "ভালো করেছেন!" :
      percentage >= 40 ? "আরও চেষ্টা করুন" : "আবার চেষ্টা করুন!";

    const label = currentSubject
      ? `NCSM • ${currentSubject}`
      : currentCategory;

    document.getElementById("recommendation").innerHTML =
      `<strong>Category:</strong> ${escapeHtml(label)} • ${percentage}%`;

    showScreen("resultScreen");
  } catch (err) {
    alert("Error saving result: " + err.message);
  }
}

document.getElementById("reviewAnswersBtn")?.addEventListener("click", showReview);

function showReview() {
  let html = "";

  currentQuiz.forEach((q, i) => {
    const userAns = userAnswers[i];
    const correct = q.correct;
    const isCorrect = userAns === correct;

    html += `
      <div class="review-question">
        <div class="review-question-number">Question ${i + 1}</div>
        <div class="review-question-text">${escapeHtml(q.question)}</div>
    `;

    q.options.forEach((opt, idx) => {
      let cls = "review-option";
      let label = "";

      if (idx === correct) {
        cls += " correct";
        label = '<span class="review-label label-correct">Correct</span>';
      }

      if (idx === userAns && !isCorrect) {
        cls += " wrong";
        label = '<span class="review-label label-your-answer">Your answer</span>';
      }

      if (idx !== correct && idx !== userAns) cls += " not-selected";

      html += `<div class="${cls}">${escapeHtml(opt)} ${label}</div>`;
    });

    html += `
        <div class="review-explanation">
          <strong>Explanation:</strong><br>
          ${escapeHtml(q.explanation || "No explanation available.")}
        </div>
      </div>
    `;
  });

  document.getElementById("reviewContainer").innerHTML = html;
  showScreen("reviewScreen");
}

document.getElementById("retakeQuizBtn")?.addEventListener("click", () => {
  if (currentCategory === "NCSM" && currentSubject) {
    startNcsmQuiz(currentSubject);
  } else {
    startQuiz(currentCategory, currentMode);
  }
});

document.getElementById("backToResultBtn")?.addEventListener("click", () =>
  showScreen("resultScreen")
);

document.getElementById("backToDashboardFromReviewBtn")?.addEventListener("click", () =>
  showScreen("dashboardScreen")
);

document.getElementById("backToDashboardBtn")?.addEventListener("click", () =>
  showScreen("dashboardScreen")
);

document.getElementById("openNcsmBtn")?.addEventListener("click", openNcsm);

document.getElementById("backFromNcsmBtn")?.addEventListener("click", () =>
  showScreen("dashboardScreen")
);

document.getElementById("logoutBtn")?.addEventListener("click", logout);
document.getElementById("adminLogoutBtn")?.addEventListener("click", logout);

function logout() {
  currentUser = null;
  showScreen("loginScreen");
}

// ---------------- User Results ----------------
document.getElementById("viewResultsBtn")?.addEventListener("click", async () => {
  if (!currentUser) return;

  try {
    const snap = await db.collection("results")
      .where("username", "==", currentUser.username)
      .orderBy("timestamp", "desc")
      .get();

    if (snap.empty) {
      alert("No exam results yet.");
      return;
    }

    let html = '<div class="user-results"><h3>Your Results</h3>';

    snap.forEach((doc, idx) => {
      const r = doc.data();
      const date = r.date ? new Date(r.date).toLocaleString() : "N/A";
      const title = r.subject
        ? `${r.category} • ${r.subject}`
        : r.category;

      html += `
        <div class="result-item">
          <div>
            <strong>Attempt ${snap.size - idx}</strong><br>
            ${escapeHtml(date)}<br>
            <small>${escapeHtml(title)} • ${r.mode}</small>
          </div>
          <div><strong>${r.score}/${r.total}</strong> (${r.percentage}%)</div>
        </div>
      `;
    });

    html += "</div>";
    document.getElementById("userResultsContainer").innerHTML = html;
    showScreen("userResultsScreen");
  } catch (err) {
    alert("Could not load results: " + err.message);
  }
});

document.getElementById("backFromResultsBtn")?.addEventListener("click", () =>
  showScreen("dashboardScreen")
);

// ---------------- Admin ----------------
async function loadAdminPanel() {
  try {
    const resultsSnap = await db.collection("results")
      .orderBy("timestamp", "desc")
      .get();

    const usersSnap = await db.collection("users").get();
    const totalUsers = Math.max(0, usersSnap.size - 1);

    const userGroups = {};
    let totalScore = 0;

    resultsSnap.forEach(doc => {
      const r = doc.data();
      totalScore += Number(r.percentage || 0);

      if (!userGroups[r.username]) userGroups[r.username] = [];
      userGroups[r.username].push(r);
    });

    const avg = resultsSnap.size
      ? (totalScore / resultsSnap.size).toFixed(1)
      : 0;

    document.getElementById("adminStats").innerHTML = `
      <div class="user-results">
        <h3>Platform Statistics</h3>
        <div class="stats-grid">
          <div class="stats-card"><div>Total Users</div><strong>${totalUsers}</strong></div>
          <div class="stats-card"><div>Total Exams</div><strong>${resultsSnap.size}</strong></div>
          <div class="stats-card"><div>Average Score</div><strong>${avg}%</strong></div>
        </div>
      </div>
    `;

    let html = "";

    Object.keys(userGroups).forEach(un => {
      const results = userGroups[un];

      html += `<div class="user-results">
        <h3>${escapeHtml(results[0]?.name || un)} (@${escapeHtml(un)})</h3>`;

      results.forEach((r, i) => {
        const date = r.date ? new Date(r.date).toLocaleString() : "N/A";
        const title = r.subject
          ? `${r.category} • ${r.subject}`
          : r.category;

        html += `
          <div class="result-item">
            <div>
              <strong>Attempt ${i + 1}</strong><br>
              ${escapeHtml(date)}<br>
              <small>${escapeHtml(title)} • ${escapeHtml(r.mode)}</small>
            </div>
            <div><strong>${r.score}/${r.total}</strong> (${r.percentage}%)</div>
          </div>
        `;
      });

      html += "</div>";
    });

    document.getElementById("allResults").innerHTML =
      html || '<p class="empty-message">No exams completed yet.</p>';

    updateAdminSubjectVisibility();
  } catch (err) {
    console.error(err);
    document.getElementById("allResults").innerHTML =
      `<p class="error-text">Could not load results: ${escapeHtml(err.message)}</p>`;
  }
}

function updateAdminSubjectVisibility() {
  const category = document.getElementById("newCategory")?.value;
  const group = document.getElementById("subjectGroup");

  if (!group) return;

  if (category === "NCSM") {
    group.style.display = "block";
  } else {
    group.style.display = "none";
  }
}

document.getElementById("newCategory")?.addEventListener(
  "change",
  updateAdminSubjectVisibility
);

document.getElementById("addQuestionForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  const category = document.getElementById("newCategory").value;
  const subject = document.getElementById("newSubject").value;
  const question = document.getElementById("newQuestion").value.trim();

  const options = [
    document.getElementById("opt1").value.trim(),
    document.getElementById("opt2").value.trim(),
    document.getElementById("opt3").value.trim(),
    document.getElementById("opt4").value.trim()
  ];

  const correct = parseInt(
    document.getElementById("newCorrect").value,
    10
  );

  const explanation =
    document.getElementById("newExplanation").value.trim();

  if (
    !question ||
    options.some(x => !x) ||
    Number.isNaN(correct) ||
    correct < 0 ||
    correct > 3
  ) {
    alert("Please fill all fields correctly.");
    return;
  }

  if (category === "NCSM" && !subject) {
    alert("Please select an NCSM subject.");
    return;
  }

  try {
    const data = {
      question,
      options,
      correct,
      category,
      explanation,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (category === "NCSM") data.subject = subject;

    await db.collection("questions").add(data);

    alert("Question added successfully!");
    e.target.reset();
    updateAdminSubjectVisibility();
  } catch (err) {
    alert("Could not add question: " + err.message);
  }
});

// ---------------- Import / Export ----------------
document.getElementById("importBtn")?.addEventListener("click", async () => {
  const text = document.getElementById("importTextarea").value.trim();
  if (!text) return alert("Paste JSON first.");

  try {
    const arr = JSON.parse(text);

    if (!Array.isArray(arr)) {
      throw new Error("JSON must be an array.");
    }

    for (const q of arr) {
      if (
        !q.question ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correct !== "number" ||
        !q.category
      ) {
        throw new Error("Invalid question format.");
      }

      if (q.category === "NCSM" && !q.subject) {
        throw new Error("Every NCSM question needs a subject.");
      }

      await db.collection("questions").add({
        ...q,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    alert(`Successfully imported ${arr.length} question(s).`);
    document.getElementById("importTextarea").value = "";
  } catch (err) {
    alert("Invalid JSON: " + err.message);
  }
});

document.getElementById("exportBtn")?.addEventListener("click", async () => {
  try {
    const snap = await db.collection("questions").get();

    const data = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download =
      `mcq-questions-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    URL.revokeObjectURL(url);
  } catch (err) {
    alert("Export failed: " + err.message);
  }
});

// Start
document.addEventListener("DOMContentLoaded", () => {
  populateNcsmSubjects();
  updateAdminSubjectVisibility();
  initFirebase();
});
