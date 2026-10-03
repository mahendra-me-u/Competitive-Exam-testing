/* =========================================================
   MCQ PRACTICE PLATFORM
   ADMIN JAVASCRIPT
   Firebase Authentication + Firestore
   ========================================================= */

"use strict";

/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBfGRzd0zYLfDa2YFAFtsryTkD7jx4AXOM",
  authDomain: "mcq-platform-a08cc.firebaseapp.com",
  projectId: "mcq-platform-a08cc",
  storageBucket: "mcq-platform-a08cc.firebasestorage.app",
  messagingSenderId: "1028116014295",
  appId: "1:1028116014295:web:7bfc56b259d4f58be93c92"
};


/* =========================================================
   NCSM SUBJECTS
   ========================================================= */

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


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let db = null;
let auth = null;
let currentAdmin = null;
let currentAdminData = null;

let allQuestions = [];
let allUsers = [];
let allResults = [];

let editingQuestionId = null;
let pendingConfirmAction = null;


/* =========================================================
   FIREBASE INITIALIZATION
   ========================================================= */

function initializeFirebase() {

  try {

    if (typeof firebase === "undefined") {
      throw new Error("Firebase SDK did not load.");
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    auth = firebase.auth();
    db = firebase.firestore();

    console.log("Firebase initialized successfully.");

    setupAuthenticationListener();

  } catch (error) {

    console.error("Firebase initialization error:", error);

    showToast(
      "Firebase Error",
      "Firebase could not be initialized.",
      "error"
    );

    showAdminLogin();

  }
}


/* =========================================================
   AUTHENTICATION LISTENER
   ========================================================= */

function setupAuthenticationListener() {

  if (!auth) return;

  auth.onAuthStateChanged(async user => {

    hideElement("authLoadingScreen");

    if (!user) {

      currentAdmin = null;
      currentAdminData = null;

      showAdminLogin();

      return;
    }

    currentAdmin = user;

    console.log("Firebase user detected:", user.uid);

    await verifyAdmin(user);

  });
}


/* =========================================================
   VERIFY ADMIN
   ========================================================= */

async function verifyAdmin(user) {

  try {

    showElement("authLoadingScreen");

    hideElement("adminLoginScreen");
    hideElement("accessDeniedScreen");
    hideElement("adminApp");

    /*
      Admin document structure:

      admins/{UID}

      {
        name: "Administrator",
        email: "admin@example.com",
        role: "admin",
        active: true
      }
    */

    const adminRef = db
      .collection("admins")
      .doc(user.uid);

    const adminSnapshot = await adminRef.get();

    if (!adminSnapshot.exists) {

      console.warn(
        "User authenticated but not present in admins collection."
      );

      showAccessDenied(
        "Your account is authenticated, but it does not have administrator privileges."
      );

      return;
    }

    const adminData = adminSnapshot.data();

    if (adminData.active === false) {

      showAccessDenied(
        "This administrator account has been disabled."
      );

      return;
    }

    currentAdminData = {
      ...adminData,
      uid: user.uid,
      email: user.email
    };

    console.log(
      "Administrator verified:",
      currentAdminData
    );

    showAdminApplication();

    updateAdminProfile();

    loadDashboard();

  } catch (error) {

    console.error(
      "Admin verification error:",
      error
    );

    showAccessDenied(
      "Unable to verify administrator access. Check your Firestore configuration and security rules."
    );

  } finally {

    hideElement("authLoadingScreen");

  }
}


/* =========================================================
   SCREEN MANAGEMENT
   ========================================================= */

function showAdminLogin() {

  hideElement("authLoadingScreen");
  hideElement("adminApp");
  hideElement("accessDeniedScreen");

  showElement("adminLoginScreen");

}


function showAdminApplication() {

  hideElement("authLoadingScreen");
  hideElement("adminLoginScreen");
  hideElement("accessDeniedScreen");

  showElement("adminApp");

}


function showAccessDenied(message) {

  hideElement("authLoadingScreen");
  hideElement("adminLoginScreen");
  hideElement("adminApp");

  const messageElement =
    document.getElementById("accessDeniedMessage");

  if (messageElement) {
    messageElement.textContent = message;
  }

  showElement("accessDeniedScreen");

}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleAdminLogin(event) {

  event.preventDefault();

  if (!auth) {

    showLoginError(
      "Firebase Authentication is not available."
    );

    return;
  }

  const email =
    document.getElementById("adminEmail")?.value.trim();

  const password =
    document.getElementById("adminPassword")?.value;

  if (!email || !password) {

    showLoginError(
      "Please enter your email and password."
    );

    return;
  }

  hideLoginMessages();

  setLoginLoading(true);

  try {

    await auth.signInWithEmailAndPassword(
      email,
      password
    );

    showLoginSuccess(
      "Login successful. Checking administrator access..."
    );

  } catch (error) {

    console.error(
      "Admin login error:",
      error
    );

    let message =
      "Unable to sign in. Please check your credentials.";

    switch (error.code) {

      case "auth/invalid-email":
        message = "Please enter a valid email address.";
        break;

      case "auth/user-not-found":
        message = "No account exists with this email.";
        break;

      case "auth/wrong-password":
        message = "Incorrect password.";
        break;

      case "auth/invalid-credential":
        message = "Incorrect email or password.";
        break;

      case "auth/user-disabled":
        message = "This Firebase account has been disabled.";
        break;

      case "auth/too-many-requests":
        message =
          "Too many failed attempts. Please try again later.";
        break;

      case "auth/network-request-failed":
        message =
          "Network error. Check your internet connection.";
        break;

    }

    showLoginError(message);

  } finally {

    setLoginLoading(false);

  }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutAdmin() {

  if (!auth) return;

  try {

    await auth.signOut();

    currentAdmin = null;
    currentAdminData = null;

    showToast(
      "Signed Out",
      "You have been securely signed out.",
      "success"
    );

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

    showToast(
      "Logout Error",
      "Unable to sign out.",
      "error"
    );

  }
}


/* =========================================================
   LOGIN UI
   ========================================================= */

function setLoginLoading(isLoading) {

  const button =
    document.getElementById("adminLoginBtn");

  const text =
    document.getElementById("adminLoginBtnText");

  const spinner =
    document.getElementById("adminLoginSpinner");

  if (button) {
    button.disabled = isLoading;
  }

  if (text) {
    text.textContent =
      isLoading ? "Signing In..." : "Sign In";
  }

  if (spinner) {

    if (isLoading) {
      spinner.classList.remove("hidden");
    } else {
      spinner.classList.add("hidden");
    }

  }

}


function showLoginError(message) {

  const element =
    document.getElementById("adminLoginError");

  if (!element) return;

  element.textContent = message;

  element.classList.remove("hidden");

}


function showLoginSuccess(message) {

  const element =
    document.getElementById("adminLoginSuccess");

  if (!element) return;

  element.textContent = message;

  element.classList.remove("hidden");

}


function hideLoginMessages() {

  hideElement("adminLoginError");
  hideElement("adminLoginSuccess");

}


/* =========================================================
   PASSWORD VISIBILITY
   ========================================================= */

function togglePasswordVisibility() {

  const input =
    document.getElementById("adminPassword");

  const button =
    document.getElementById("toggleAdminPassword");

  if (!input) return;

  if (input.type === "password") {

    input.type = "text";

    if (button) {
      button.textContent = "🙈";
    }

  } else {

    input.type = "password";

    if (button) {
      button.textContent = "👁";
    }

  }

}


/* =========================================================
   ADMIN PROFILE
   ========================================================= */

function updateAdminProfile() {

  if (!currentAdminData) return;

  const name =
    currentAdminData.name ||
    currentAdmin?.displayName ||
    "Administrator";

  const email =
    currentAdminData.email ||
    currentAdmin?.email ||
    "-";

  const uid =
    currentAdminData.uid ||
    currentAdmin?.uid ||
    "-";

  setText("sidebarAdminName", name);
  setText("sidebarAdminEmail", email);

  setText("topbarAdminName", name);

  setText("settingsAdminName", name);
  setText("settingsAdminEmail", email);
  setText("settingsAdminUid", uid);

  setText(
    "settingsAdminRole",
    currentAdminData.role || "Admin"
  );

  const status =
    currentAdminData.active === false
      ? "Inactive"
      : "Active";

  setText(
    "settingsAdminStatus",
    status
  );

  const avatars = [
    "sidebarAdminAvatar",
    "topbarAdminAvatar"
  ];

  const initial =
    name.charAt(0).toUpperCase();

  avatars.forEach(id => {

    const element =
      document.getElementById(id);

    if (element) {
      element.textContent = initial;
    }

  });

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

  document
    .querySelectorAll(".admin-nav-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const section =
            button.dataset.section;

          if (section) {
            navigateToSection(section);
          }

        }
      );

    });


  document
    .querySelectorAll("[data-section]")
    .forEach(button => {

      if (
        button.classList.contains("admin-nav-item")
      ) {
        return;
      }

      button.addEventListener(
        "click",
        () => {

          const section =
            button.dataset.section;

          if (section) {
            navigateToSection(section);
          }

        }
      );

    });

}


function navigateToSection(sectionName) {

  document
    .querySelectorAll(".admin-section")
    .forEach(section => {

      section.classList.remove("active");

    });


  const target =
    document.getElementById(sectionName);

  if (target) {
    target.classList.add("active");
  }


  document
    .querySelectorAll(".admin-nav-item")
    .forEach(item => {

      item.classList.remove("active");

      if (
        item.dataset.section === sectionName
      ) {
        item.classList.add("active");
      }

    });


  updatePageHeading(sectionName);


  closeMobileSidebar();


  if (sectionName === "dashboard") {
    loadDashboard();
  }

  if (sectionName === "questions") {
    loadQuestions();
  }

  if (sectionName === "users") {
    loadUsers();
  }

  if (sectionName === "results") {
    loadResults();
  }

}


/* =========================================================
   PAGE HEADINGS
   ========================================================= */

function updatePageHeading(sectionName) {

  const titles = {

    dashboard: [
      "Dashboard",
      "Overview of your MCQ platform"
    ],

    questions: [
      "Question Bank",
      "View, edit and manage all MCQ questions"
    ],

    addQuestion: [
      "Add Question",
      "Create a new MCQ question"
    ],

    users: [
      "Users",
      "Manage registered student accounts"
    ],

    results: [
      "Results",
      "Review student quiz performance"
    ],

    importExport: [
      "Import / Export",
      "Manage your question bank data"
    ],

    settings: [
      "Settings",
      "Administrator account settings"
    ]

  };

  const data =
    titles[sectionName] ||
    titles.dashboard;

  setText("pageTitle", data[0]);
  setText("pageSubtitle", data[1]);

}


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function openMobileSidebar() {

  const sidebar =
    document.getElementById("adminSidebar");

  if (sidebar) {
    sidebar.classList.add("mobile-open");
  }

}


function closeMobileSidebar() {

  const sidebar =
    document.getElementById("adminSidebar");

  if (sidebar) {
    sidebar.classList.remove("mobile-open");
  }

}


/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function loadDashboard() {

  if (!db || !currentAdmin) return;

  setDashboardDate();

  try {

    await Promise.all([
      loadQuestions(),
      loadUsers(),
      loadResults()
    ]);

    updateDashboardStatistics();
    renderCategoryDistribution();
    renderDashboardResults();

  } catch (error) {

    console.error(
      "Dashboard loading error:",
      error
    );

  }

}


/* =========================================================
   LOAD QUESTIONS
   ========================================================= */

async function loadQuestions() {

  if (!db) return;

  try {

    const snapshot =
      await db.collection("questions").get();

    allQuestions = [];

    snapshot.forEach(doc => {

      allQuestions.push({
        id: doc.id,
        ...doc.data()
      });

    });

    console.log(
      `Loaded ${allQuestions.length} questions.`
    );

    updateDashboardStatistics();

    renderQuestionsTable();

    updateQuestionFilters();

    setText(
      "exportQuestionCount",
      allQuestions.length
    );

  } catch (error) {

    console.error(
      "Question loading error:",
      error
    );

    showToast(
      "Question Error",
      "Unable to load questions.",
      "error"
    );

  }

}


/* =========================================================
   RENDER QUESTIONS TABLE
   ========================================================= */

function renderQuestionsTable() {

  const tbody =
    document.getElementById("questionsTableBody");

  if (!tbody) return;

  const search =
    document
      .getElementById("questionSearch")
      ?.value
      .toLowerCase()
      .trim() || "";

  const category =
    document
      .getElementById("questionCategoryFilter")
      ?.value || "all";


  let questions =
    [...allQuestions];


  if (search) {

    questions =
      questions.filter(question => {

        const text =
          String(
            question.question || ""
          ).toLowerCase();

        const subject =
          String(
            question.subject || ""
          ).toLowerCase();

        return (
          text.includes(search) ||
          subject.includes(search)
        );

      });

  }


  if (category !== "all") {

    questions =
      questions.filter(
        question =>
          question.category === category
      );

  }


  if (!questions.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-state-icon">☷</div>
            <h3>No questions found</h3>
            <p>
              Try changing your search or filter.
            </p>
          </div>
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    questions
      .map(question =>
        createQuestionRow(question)
      )
      .join("");

}


function createQuestionRow(question) {

  const questionText =
    escapeHTML(
      question.question || "Untitled question"
    );

  const category =
    escapeHTML(
      question.category || "-"
    );

  const subject =
    escapeHTML(
      question.subject || "-"
    );

  const correctIndex =
    Number.isInteger(
      Number(question.correct)
    )
      ? Number(question.correct)
      : null;

  const correctLetter =
    correctIndex !== null
      ? ["A", "B", "C", "D"][correctIndex] || "-"
      : "-";

  return `
    <tr>

      <td>
        <div class="question-preview">
          ${questionText}
        </div>
      </td>

      <td>
        <span class="category-badge">
          ${category}
        </span>
      </td>

      <td>
        ${subject}
      </td>

      <td>
        <span class="correct-badge">
          ${correctLetter}
        </span>
      </td>

      <td>

        <div class="table-actions">

          <button
            class="table-action-btn edit"
            type="button"
            data-edit-question="${question.id}"
            title="Edit"
          >
            ✎
          </button>

          <button
            class="table-action-btn delete"
            type="button"
            data-delete-question="${question.id}"
            title="Delete"
          >
            ×
          </button>

        </div>

      </td>

    </tr>
  `;

}


/* =========================================================
   QUESTION FILTERS
   ========================================================= */

function updateQuestionFilters() {

  const select =
    document.getElementById(
      "questionCategoryFilter"
    );

  if (!select) return;

  const current =
    select.value;

  const categories =
    [
      ...new Set(
        allQuestions
          .map(q => q.category)
          .filter(Boolean)
      )
    ]
    .sort();


  select.innerHTML = `
    <option value="all">
      All Categories
    </option>
  `;

  categories.forEach(category => {

    const option =
      document.createElement("option");

    option.value = category;
    option.textContent = category;

    select.appendChild(option);

  });


  if (
    categories.includes(current)
  ) {
    select.value = current;
  }

}


/* =========================================================
   NCSM SUBJECT DROPDOWN
   ========================================================= */

function populateNCSMSubjects() {

  const select =
    document.getElementById("newSubject");

  if (!select) return;

  select.innerHTML = `
    <option value="">
      Select NCSM Subject
    </option>
  `;

  NCSM_SUBJECTS.forEach(subject => {

    const option =
      document.createElement("option");

    option.value = subject;
    option.textContent = subject;

    select.appendChild(option);

  });

}


/* =========================================================
   CATEGORY / SUBJECT LOGIC
   ========================================================= */

function handleCategoryChange() {

  const category =
    document.getElementById(
      "newCategory"
    )?.value;

  const subjectGroup =
    document.getElementById(
      "subjectGroup"
    );

  const subject =
    document.getElementById(
      "newSubject"
    );

  if (
    category === "NCSM"
  ) {

    if (subjectGroup) {
      subjectGroup.classList.remove("hidden");
    }

    if (subject) {
      subject.required = true;
    }

  } else {

    if (subjectGroup) {
      subjectGroup.classList.add("hidden");
    }

    if (subject) {
      subject.required = false;
      subject.value = "";
    }

  }

}


/* =========================================================
   SAVE QUESTION
   ========================================================= */

async function handleQuestionSubmit(event) {

  event.preventDefault();

  if (!db || !currentAdmin) {

    showToast(
      "Not Authorized",
      "Administrator authentication is required.",
      "error"
    );

    return;
  }


  const category =
    document.getElementById(
      "newCategory"
    )?.value;

  const subject =
    document.getElementById(
      "newSubject"
    )?.value || "";

  const question =
    document.getElementById(
      "newQuestion"
    )?.value.trim();

  const opt1 =
    document.getElementById(
      "opt1"
    )?.value.trim();

  const opt2 =
    document.getElementById(
      "opt2"
    )?.value.trim();

  const opt3 =
    document.getElementById(
      "opt3"
    )?.value.trim();

  const opt4 =
    document.getElementById(
      "opt4"
    )?.value.trim();

  const correct =
    Number(
      document.getElementById(
        "newCorrect"
      )?.value
    );

  const explanation =
    document.getElementById(
      "newExplanation"
    )?.value.trim() || "";


  if (
    !category ||
    !question ||
    !opt1 ||
    !opt2 ||
    !opt3 ||
    !opt4
  ) {

    showToast(
      "Missing Information",
      "Please complete all required fields.",
      "error"
    );

    return;
  }


  if (
    category === "NCSM" &&
    !subject
  ) {

    showToast(
      "Subject Required",
      "Please select an NCSM subject.",
      "error"
    );

    return;
  }


  if (
    !Number.isInteger(correct) ||
    correct < 0 ||
    correct > 3
  ) {

    showToast(
      "Invalid Answer",
      "Correct answer must be between 0 and 3.",
      "error"
    );

    return;
  }


  const questionData = {

    question,

    options: [
      opt1,
      opt2,
      opt3,
      opt4
    ],

    correct,

    category,

    subject:
      category === "NCSM"
        ? subject
        : "",

    explanation,

    updatedAt:
      firebase.firestore.FieldValue.serverTimestamp(),

    updatedBy:
      currentAdmin.uid

  };


  try {

    if (editingQuestionId) {

      await db
        .collection("questions")
        .doc(editingQuestionId)
        .update(questionData);

      showToast(
        "Question Updated",
        "The question has been updated successfully.",
        "success"
      );

    } else {

      questionData.createdAt =
        firebase.firestore.FieldValue.serverTimestamp();

      questionData.createdBy =
        currentAdmin.uid;

      await db
        .collection("questions")
        .add(questionData);

      showToast(
        "Question Added",
        "The question has been added successfully.",
        "success"
      );

    }


    clearQuestionForm();

    editingQuestionId = null;

    await loadQuestions();

    navigateToSection("questions");

  } catch (error) {

    console.error(
      "Question save error:",
      error
    );

    showToast(
      "Save Failed",
      getFirebaseErrorMessage(error),
      "error"
    );

  }

}


/* =========================================================
   EDIT QUESTION
   ========================================================= */

function editQuestion(questionId) {

  const question =
    allQuestions.find(
      item => item.id === questionId
    );

  if (!question) return;

  editingQuestionId = questionId;

  setValue(
    "newCategory",
    question.category || "General Knowledge"
  );

  handleCategoryChange();

  setValue(
    "newSubject",
    question.subject || ""
  );

  setValue(
    "newQuestion",
    question.question || ""
  );

  const options =
    Array.isArray(question.options)
      ? question.options
      : [];

  setValue(
    "opt1",
    options[0] || ""
  );

  setValue(
    "opt2",
    options[1] || ""
  );

  setValue(
    "opt3",
    options[2] || ""
  );

  setValue(
    "opt4",
    options[3] || ""
  );

  setValue(
    "newCorrect",
    String(
      Number.isInteger(Number(question.correct))
        ? Number(question.correct)
        : 0
    )
  );

  setValue(
    "newExplanation",
    question.explanation || ""
  );


  navigateToSection("addQuestion");

  const heading =
    document.querySelector(
      "#addQuestion .section-intro h2"
    );

  if (heading) {
    heading.textContent =
      "Edit Question";
  }


  const submitButton =
    document.querySelector(
      "#questionForm button[type='submit']"
    );

  if (submitButton) {
    submitButton.textContent =
      "Update Question";
  }

}


/* =========================================================
   DELETE QUESTION
   ========================================================= */

function requestDeleteQuestion(questionId) {

  const question =
    allQuestions.find(
      item => item.id === questionId
    );

  if (!question) return;

  pendingConfirmAction =
    async () => {

      try {

        await db
          .collection("questions")
          .doc(questionId)
          .delete();

        showToast(
          "Question Deleted",
          "The question was permanently deleted.",
          "success"
        );

        await loadQuestions();

      } catch (error) {

        console.error(
          "Delete question error:",
          error
        );

        showToast(
          "Delete Failed",
          getFirebaseErrorMessage(error),
          "error"
        );

      }

    };


  showConfirmModal(
    "Delete Question?",
    "This question will be permanently removed from the question bank."
  );

}


/* =========================================================
   CLEAR QUESTION FORM
   ========================================================= */

function clearQuestionForm() {

  const form =
    document.getElementById(
      "questionForm"
    );

  if (form) {
    form.reset();
  }

  editingQuestionId = null;

  const heading =
    document.querySelector(
      "#addQuestion .section-intro h2"
    );

  if (heading) {
    heading.textContent =
      "Add Question";
  }


  const submitButton =
    document.querySelector(
      "#questionForm button[type='submit']"
    );

  if (submitButton) {
    submitButton.textContent =
      "Save Question";
  }

  handleCategoryChange();

}


/* =========================================================
   LOAD USERS
   ========================================================= */

async function loadUsers() {

  if (!db) return;

  try {

    const snapshot =
      await db
        .collection("users")
        .get();

    allUsers = [];

    snapshot.forEach(doc => {

      allUsers.push({
        id: doc.id,
        ...doc.data()
      });

    });

    console.log(
      `Loaded ${allUsers.length} users.`
    );

    setText(
      "totalUsers",
      allUsers.length
    );

    renderUsersTable();

  } catch (error) {

    console.error(
      "Users loading error:",
      error
    );

    showToast(
      "User Error",
      "Unable to load users.",
      "error"
    );

  }

}


/* =========================================================
   RENDER USERS
   ========================================================= */

function renderUsersTable() {

  const tbody =
    document.getElementById(
      "usersTableBody"
    );

  if (!tbody) return;

  const search =
    document
      .getElementById("userSearch")
      ?.value
      .toLowerCase()
      .trim() || "";


  let users =
    [...allUsers];


  if (search) {

    users =
      users.filter(user => {

        const name =
          String(
            user.name ||
            user.fullName ||
            ""
          ).toLowerCase();

        const username =
          String(
            user.username || ""
          ).toLowerCase();

        return (
          name.includes(search) ||
          username.includes(search)
        );

      });

  }


  if (!users.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">
            <div class="empty-state-icon">♙</div>
            <h3>No users found</h3>
            <p>No registered student accounts match your search.</p>
          </div>
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    users
      .map(user => {

        const name =
          escapeHTML(
            user.name ||
            user.fullName ||
            "Unknown"
          );

        const username =
          escapeHTML(
            user.username || "-"
          );

        const created =
          formatFirestoreDate(
            user.createdAt
          );

        return `
          <tr>

            <td>
              <strong>${name}</strong>
            </td>

            <td>
              ${username}
            </td>

            <td>
              ${created}
            </td>

            <td>
              <span class="status-badge active">
                Active
              </span>
            </td>

          </tr>
        `;

      })
      .join("");

}


/* =========================================================
   LOAD RESULTS
   ========================================================= */

async function loadResults() {

  if (!db) return;

  try {

    const snapshot =
      await db
        .collection("results")
        .get();

    allResults = [];

    snapshot.forEach(doc => {

      allResults.push({
        id: doc.id,
        ...doc.data()
      });

    });


    allResults.sort(
      (a, b) =>
        getTimestampValue(b.createdAt) -
        getTimestampValue(a.createdAt)
    );


    console.log(
      `Loaded ${allResults.length} results.`
    );

    setText(
      "totalResults",
      allResults.length
    );

    renderResultsTable();

  } catch (error) {

    console.error(
      "Results loading error:",
      error
    );

    showToast(
      "Results Error",
      "Unable to load results.",
      "error"
    );

  }

}


/* =========================================================
   RENDER RESULTS
   ========================================================= */

function renderResultsTable() {

  const tbody =
    document.getElementById(
      "resultsTableBody"
    );

  if (!tbody) return;

  const search =
    document
      .getElementById("resultSearch")
      ?.value
      .toLowerCase()
      .trim() || "";

  const category =
    document
      .getElementById("resultCategoryFilter")
      ?.value || "all";


  let results =
    [...allResults];


  if (search) {

    results =
      results.filter(result => {

        const student =
          String(
            result.userName ||
            result.name ||
            result.username ||
            ""
          ).toLowerCase();

        const resultCategory =
          String(
            result.category || ""
          ).toLowerCase();

        const subject =
          String(
            result.subject || ""
          ).toLowerCase();

        return (
          student.includes(search) ||
          resultCategory.includes(search) ||
          subject.includes(search)
        );

      });

  }


  if (category !== "all") {

    results =
      results.filter(
        result =>
          result.category === category
      );

  }


  if (!results.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-state-icon">▥</div>
            <h3>No results found</h3>
            <p>No quiz results match your search.</p>
          </div>
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    results
      .map(result =>
        createResultRow(result)
      )
      .join("");

}


function createResultRow(result) {

  const student =
    escapeHTML(
      result.userName ||
      result.name ||
      result.username ||
      "Unknown"
    );

  const category =
    escapeHTML(
      result.category || "-"
    );

  const subject =
    escapeHTML(
      result.subject || "-"
    );

  const score =
    result.score ??
    result.correct ??
    0;

  const total =
    result.totalQuestions ??
    result.total ??
    0;

  let percentage =
    result.percentage;

  if (
    percentage === undefined &&
    total > 0
  ) {

    percentage =
      (Number(score) / Number(total)) * 100;

  }

  percentage =
    Number(percentage || 0).toFixed(1);

  const date =
    formatFirestoreDate(
      result.createdAt ||
      result.timestamp ||
      result.date
    );


  return `
    <tr>

      <td>
        <strong>${student}</strong>
      </td>

      <td>
        <span class="category-badge">
          ${category}
        </span>
      </td>

      <td>
        ${subject}
      </td>

      <td>
        ${score} / ${total}
      </td>

      <td>
        <span class="score-badge">
          ${percentage}%
        </span>
      </td>

      <td>
        ${date}
      </td>

    </tr>
  `;

}


/* =========================================================
   DASHBOARD STATISTICS
   ========================================================= */

function updateDashboardStatistics() {

  setText(
    "totalQuestions",
    allQuestions.length
  );

  setText(
    "totalUsers",
    allUsers.length
  );

  setText(
    "totalResults",
    allResults.length
  );


  const ncsmCount =
    allQuestions.filter(
      question =>
        question.category === "NCSM"
    ).length;

  setText(
    "ncsmQuestions",
    ncsmCount
  );

  setText(
    "exportQuestionCount",
    allQuestions.length
  );

}


/* =========================================================
   CATEGORY DISTRIBUTION
   ========================================================= */

function renderCategoryDistribution() {

  const container =
    document.getElementById(
      "categoryDistribution"
    );

  if (!container) return;


  const counts = {};


  allQuestions.forEach(question => {

    const category =
      question.category ||
      "Uncategorized";

    counts[category] =
      (counts[category] || 0) + 1;

  });


  const categories =
    Object.keys(counts);


  if (!categories.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          ☷
        </div>

        <p>
          No questions have been added yet.
        </p>
      </div>
    `;

    return;
  }


  const max =
    Math.max(
      ...Object.values(counts)
    );


  container.innerHTML =
    categories
      .map(category => {

        const count =
          counts[category];

        const percentage =
          max > 0
            ? (count / max) * 100
            : 0;

        return `
          <div class="distribution-item">

            <div class="distribution-header">

              <span>
                ${escapeHTML(category)}
              </span>

              <strong>
                ${count}
              </strong>

            </div>

            <div class="distribution-bar">

              <div
                class="distribution-progress"
                style="width:${percentage}%"
              ></div>

            </div>

          </div>
        `;

      })
      .join("");

}


/* =========================================================
   DASHBOARD RECENT RESULTS
   ========================================================= */

function renderDashboardResults() {

  const tbody =
    document.getElementById(
      "dashboardResultsTable"
    );

  if (!tbody) return;


  const results =
    allResults.slice(0, 5);


  if (!results.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <p>
              No quiz results available yet.
            </p>
          </div>
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    results
      .map(result =>
        createResultRow(result)
      )
      .join("");

}


/* =========================================================
   DASHBOARD DATE
   ========================================================= */

function setDashboardDate() {

  const element =
    document.getElementById(
      "dashboardDate"
    );

  if (!element) return;

  const now =
    new Date();

  element.textContent =
    now.toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

}


/* =========================================================
   IMPORT QUESTIONS
   ========================================================= */

async function importQuestions() {

  if (!db || !currentAdmin) {

    showToast(
      "Not Authorized",
      "Administrator authentication is required.",
      "error"
    );

    return;
  }


  const textarea =
    document.getElementById(
      "importTextarea"
    );

  if (!textarea) return;


  const raw =
    textarea.value.trim();


  if (!raw) {

    showToast(
      "No Data",
      "Paste a JSON question array first.",
      "error"
    );

    return;
  }


  let questions;

  try {

    questions =
      JSON.parse(raw);

  } catch (error) {

    showToast(
      "Invalid JSON",
      "The imported text is not valid JSON.",
      "error"
    );

    return;
  }


  if (!Array.isArray(questions)) {

    showToast(
      "Invalid Format",
      "JSON must contain an array of questions.",
      "error"
    );

    return;
  }


  if (!questions.length) {

    showToast(
      "Empty Import",
      "The JSON array contains no questions.",
      "error"
    );

    return;
  }


  try {

    let batch =
      db.batch();

    let operationCount = 0;
    let importedCount = 0;


    for (
      const question of questions
    ) {

      if (
        !question.question ||
        !Array.isArray(question.options) ||
        question.options.length !== 4
      ) {
        continue;
      }


      const category =
        question.category ||
        "General Knowledge";


      const data = {

        question:
          String(question.question),

        options:
          question.options.map(
            option => String(option)
          ),

        correct:
          Number(question.correct ?? 0),

        category,

        subject:
          category === "NCSM"
            ? String(question.subject || "")
            : "",

        explanation:
          String(question.explanation || ""),

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        createdBy:
          currentAdmin.uid,

        updatedBy:
          currentAdmin.uid

      };


      const ref =
        db.collection("questions").doc();

      batch.set(ref, data);

      operationCount++;
      importedCount++;


      /*
        Firestore batch writes are limited to 500 operations.
      */

      if (operationCount >= 450) {

        await batch.commit();

        batch =
          db.batch();

        operationCount = 0;

      }

    }


    if (operationCount > 0) {

      await batch.commit();

    }


    textarea.value = "";

    showToast(
      "Import Complete",
      `${importedCount} questions imported successfully.`,
      "success"
    );


    await loadQuestions();

  } catch (error) {

    console.error(
      "Import error:",
      error
    );

    showToast(
      "Import Failed",
      getFirebaseErrorMessage(error),
      "error"
    );

  }

}


/* =========================================================
   EXPORT QUESTIONS
   ========================================================= */

function exportQuestions() {

  if (!allQuestions.length) {

    showToast(
      "Nothing to Export",
      "There are no questions in the question bank.",
      "error"
    );

    return;
  }


  const exportData =
    allQuestions.map(
      question => {

        const data = {
          question:
            question.question || "",

          options:
            question.options || [],

          correct:
            Number(question.correct || 0),

          category:
            question.category || "",

          subject:
            question.subject || "",

          explanation:
            question.explanation || ""
        };

        return data;

      }
    );


  const json =
    JSON.stringify(
      exportData,
      null,
      2
    );


  const blob =
    new Blob(
      [json],
      {
        type: "application/json"
      }
    );


  const url =
    URL.createObjectURL(blob);


  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `mcq-question-bank-${getDateFileName()}.json`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);


  showToast(
    "Export Complete",
    "Question bank downloaded successfully.",
    "success"
  );

}


/* =========================================================
   CONFIRM MODAL
   ========================================================= */

function showConfirmModal(
  title,
  message
) {

  setText(
    "confirmModalTitle",
    title
  );

  setText(
    "confirmModalMessage",
    message
  );

  showElement(
    "adminConfirmModal"
  );

}


function closeConfirmModal() {

  hideElement(
    "adminConfirmModal"
  );

  pendingConfirmAction = null;

}


async function executeConfirmedAction() {

  if (
    typeof pendingConfirmAction !==
    "function"
  ) {
    closeConfirmModal();
    return;
  }


  const action =
    pendingConfirmAction;

  pendingConfirmAction = null;

  closeConfirmModal();

  await action();

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
  title,
  message,
  type = "success"
) {

  const toast =
    document.getElementById(
      "adminToast"
    );

  if (!toast) return;


  const titleElement =
    toast.querySelector(
      "strong"
    );

  const messageElement =
    toast.querySelector(
      "p"
    );

  const icon =
    toast.querySelector(
      ".toast-icon"
    );


  if (titleElement) {
    titleElement.textContent =
      title;
  }

  if (messageElement) {
    messageElement.textContent =
      message;
  }


  toast.classList.remove(
    "success",
    "error",
    "warning"
  );

  toast.classList.add(type);

  if (icon) {

    icon.textContent =
      type === "error"
        ? "!"
        : type === "warning"
          ? "!"
          : "✓";

  }


  toast.classList.remove(
    "hidden"
  );


  clearTimeout(
    window.adminToastTimer
  );


  window.adminToastTimer =
    setTimeout(
      () => {

        toast.classList.add(
          "hidden"
        );

      },
      4000
    );

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function showNotifications() {

  const panel =
    document.getElementById(
      "notificationPanel"
    );

  if (!panel) return;

  panel.classList.toggle(
    "hidden"
  );

}


function closeNotifications() {

  hideElement(
    "notificationPanel"
  );

}


/* =========================================================
   FIREBASE ERROR MESSAGES
   ========================================================= */

function getFirebaseErrorMessage(error) {

  if (!error) {
    return "An unknown error occurred.";
  }


  switch (error.code) {

    case "permission-denied":
      return "Permission denied by Firestore security rules.";

    case "unavailable":
      return "Firebase is temporarily unavailable.";

    case "failed-precondition":
      return "The requested operation could not be completed.";

    case "network-request-failed":
      return "Network connection failed.";

    default:
      return error.message ||
        "An unexpected Firebase error occurred.";

  }

}


/* =========================================================
   EVENT DELEGATION
   ========================================================= */

function initializeQuestionTableActions() {

  document.addEventListener(
    "click",
    event => {

      const editButton =
        event.target.closest(
          "[data-edit-question]"
        );

      if (editButton) {

        editQuestion(
          editButton.dataset.editQuestion
        );

        return;
      }


      const deleteButton =
        event.target.closest(
          "[data-delete-question]"
        );

      if (deleteButton) {

        requestDeleteQuestion(
          deleteButton.dataset.deleteQuestion
        );

      }

    }
  );

}


/* =========================================================
   SEARCH EVENTS
   ========================================================= */

function initializeSearchEvents() {

  const questionSearch =
    document.getElementById(
      "questionSearch"
    );

  if (questionSearch) {

    questionSearch.addEventListener(
      "input",
      renderQuestionsTable
    );

  }


  const questionFilter =
    document.getElementById(
      "questionCategoryFilter"
    );

  if (questionFilter) {

    questionFilter.addEventListener(
      "change",
      renderQuestionsTable
    );

  }


  const userSearch =
    document.getElementById(
      "userSearch"
    );

  if (userSearch) {

    userSearch.addEventListener(
      "input",
      renderUsersTable
    );

  }


  const resultSearch =
    document.getElementById(
      "resultSearch"
    );

  if (resultSearch) {

    resultSearch.addEventListener(
      "input",
      renderResultsTable
    );

  }


  const resultFilter =
    document.getElementById(
      "resultCategoryFilter"
    );

  if (resultFilter) {

    resultFilter.addEventListener(
      "change",
      renderResultsTable
    );

  }

}


/* =========================================================
   GLOBAL EVENT INITIALIZATION
   ========================================================= */

function initializeEventListeners() {

  const loginForm =
    document.getElementById(
      "adminLoginForm"
    );

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      handleAdminLogin
    );

  }


  const logoutButtons = [

    "logoutBtn",
    "settingsLogoutBtn",
    "deniedLogoutBtn"

  ];

  logoutButtons.forEach(id => {

    const button =
      document.getElementById(id);

    if (button) {

      button.addEventListener(
        "click",
        logoutAdmin
      );

    }

  });


  const togglePassword =
    document.getElementById(
      "toggleAdminPassword"
    );

  if (togglePassword) {

    togglePassword.addEventListener(
      "click",
      togglePasswordVisibility
    );

  }


  const questionForm =
    document.getElementById(
      "questionForm"
    );

  if (questionForm) {

    questionForm.addEventListener(
      "submit",
      handleQuestionSubmit
    );

  }


  const clearQuestionButton =
    document.getElementById(
      "clearQuestionBtn"
    );

  if (clearQuestionButton) {

    clearQuestionButton.addEventListener(
      "click",
      clearQuestionForm
    );

  }


  const category =
    document.getElementById(
      "newCategory"
    );

  if (category) {

    category.addEventListener(
      "change",
      handleCategoryChange
    );

  }


  const importButton =
    document.getElementById(
      "importBtn"
    );

  if (importButton) {

    importButton.addEventListener(
      "click",
      importQuestions
    );

  }


  const exportButton =
    document.getElementById(
      "exportBtn"
    );

  if (exportButton) {

    exportButton.addEventListener(
      "click",
      exportQuestions
    );

  }


  const refreshQuestions =
    document.getElementById(
      "refreshQuestionsBtn"
    );

  if (refreshQuestions) {

    refreshQuestions.addEventListener(
      "click",
      loadQuestions
    );

  }


  const confirmButton =
    document.getElementById(
      "confirmActionBtn"
    );

  if (confirmButton) {

    confirmButton.addEventListener(
      "click",
      executeConfirmedAction
    );

  }


  const cancelConfirm =
    document.getElementById(
      "cancelConfirmBtn"
    );

  if (cancelConfirm) {

    cancelConfirm.addEventListener(
      "click",
      closeConfirmModal
    );

  }


  document
    .querySelectorAll(".modal-close")
    .forEach(button => {

      button.addEventListener(
        "click",
        closeConfirmModal
      );

    });


  const mobileMenu =
    document.getElementById(
      "mobileMenuBtn"
    );

  if (mobileMenu) {

    mobileMenu.addEventListener(
      "click",
      openMobileSidebar
    );

  }


  const closeSidebar =
    document.getElementById(
      "closeSidebarBtn"
    );

  if (closeSidebar) {

    closeSidebar.addEventListener(
      "click",
      closeMobileSidebar
    );

  }


  const notification =
    document.getElementById(
      "notificationBtn"
    );

  if (notification) {

    notification.addEventListener(
      "click",
      showNotifications
    );

  }


  const closeNotification =
    document.getElementById(
      "closeNotificationBtn"
    );

  if (closeNotification) {

    closeNotification.addEventListener(
      "click",
      closeNotifications
    );

  }


  const closeToast =
    document.getElementById(
      "closeToastBtn"
    );

  if (closeToast) {

    closeToast.addEventListener(
      "click",
      () => {

        hideElement(
          "adminToast"
        );

      }
    );

  }

}


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function showElement(id) {

  const element =
    document.getElementById(id);

  if (element) {
    element.classList.remove(
      "hidden"
    );
  }

}


function hideElement(id) {

  const element =
    document.getElementById(id);

  if (element) {
    element.classList.add(
      "hidden"
    );
  }

}


function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value;
  }

}


function setValue(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {
    element.value =
      value;
  }

}


function getTimestampValue(timestamp) {

  if (!timestamp) {
    return 0;
  }

  if (
    typeof timestamp.toMillis ===
    "function"
  ) {
    return timestamp.toMillis();
  }

  if (
    timestamp instanceof Date
  ) {
    return timestamp.getTime();
  }

  if (
    typeof timestamp === "number"
  ) {
    return timestamp;
  }

  return 0;

}


function formatFirestoreDate(value) {

  if (!value) {
    return "-";
  }


  let date;


  if (
    typeof value.toDate ===
    "function"
  ) {

    date =
      value.toDate();

  } else if (
    value instanceof Date
  ) {

    date =
      value;

  } else if (
    typeof value === "string"
  ) {

    date =
      new Date(value);

  } else {

    return "-";

  }


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


function getDateFileName() {

  const date =
    new Date();

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0")
  ].join("-");

}


function escapeHTML(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    populateNCSMSubjects();

    initializeEventListeners();

    initializeNavigation();

    initializeQuestionTableActions();

    initializeSearchEvents();

    handleCategoryChange();

    initializeFirebase();

  }
);
