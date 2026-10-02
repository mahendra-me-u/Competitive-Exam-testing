/* =========================================================
   MCQ PRACTICE PLATFORM
   COMPLETE SCRIPT.JS
   ========================================================= */


/* =========================================================
   FIREBASE CONFIGURATION
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
   FIVE DEMO CHAPTERS FOR EVERY SUBJECT
   ========================================================= */

const NCSM_CHAPTERS = [
  "Chapter 1 - Basic Concepts",
  "Chapter 2 - Fundamentals",
  "Chapter 3 - Intermediate Practice",
  "Chapter 4 - Advanced Practice",
  "Chapter 5 - Revision Test"
];


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let db = null;

let currentUser = null;

let currentQuiz = [];

let currentQuestionIndex = 0;

let userAnswers = [];

let currentMode = "exam";

let currentCategory = "";

let currentSubject = "";

let currentChapter = "";

let lastQuizResult = null;

let allQuestionsCache = [];

let firebaseReady = false;


/* =========================================================
   APPLICATION START
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeApplication();

});


async function initializeApplication() {

  setupFooter();

  setupEventListeners();

  setupNCSMSubjectSelector();

  setupAdminCategorySelector();

  await initFirebase();

}


/* =========================================================
   FIREBASE INITIALIZATION
   ========================================================= */

async function initFirebase() {

  const status =
    document.getElementById("firebaseStatus");

  showScreen("loginScreen");

  try {

    if (typeof firebase === "undefined") {

      throw new Error(
        "Firebase SDK did not load."
      );

    }


    if (!firebase.apps.length) {

      firebase.initializeApp(
        firebaseConfig
      );

    }


    db = firebase.firestore();

    firebaseReady = true;


    if (status) {

      status.textContent =
        "Firebase connected";

      status.className =
        "success-message";

      setTimeout(() => {

        status.classList.add("hidden");

      }, 1500);

    }


  } catch (error) {

    console.error(
      "Firebase initialization error:",
      error
    );

    firebaseReady = false;

    db = null;


    if (status) {

      status.textContent =
        "Firebase could not be connected.";

      status.className =
        "error-message";

    }

  }

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {


  /* LOGIN */

  const loginForm =
    document.getElementById("loginForm");

  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      handleLogin
    );

  }


  /* SIGNUP */

  const signupForm =
    document.getElementById("signupForm");

  if (signupForm) {

    signupForm.addEventListener(
      "submit",
      handleSignup
    );

  }


  /* LOGIN / SIGNUP TOGGLE */

  document
    .getElementById("showSignup")
    ?.addEventListener(
      "click",
      () => {

        showScreen("signupScreen");

      }
    );


  document
    .getElementById("showLogin")
    ?.addEventListener(
      "click",
      () => {

        showScreen("loginScreen");

      }
    );


  /* DASHBOARD */

  document
    .getElementById("brandHomeBtn")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openDashboard();

      }
    );


  document
    .getElementById("navDashboardBtn")
    ?.addEventListener(
      "click",
      openDashboard
    );


  document
    .getElementById("navResultsBtn")
    ?.addEventListener(
      "click",
      openUserResults
    );


  document
    .getElementById("navAccountBtn")
    ?.addEventListener(
      "click",
      openAccount
    );


  document
    .getElementById("accountButton")
    ?.addEventListener(
      "click",
      openAccount
    );


  /* NCSM */

  document
    .getElementById("openNcsmBtn")
    ?.addEventListener(
      "click",
      openNCSM
    );


  document
    .getElementById("backFromNcsmBtn")
    ?.addEventListener(
      "click",
      openDashboard
    );


  /* QUIZ */

  document
    .getElementById("prevBtn")
    ?.addEventListener(
      "click",
      previousQuestion
    );


  document
    .getElementById("nextBtn")
    ?.addEventListener(
      "click",
      nextQuestion
    );


  document
    .getElementById("backFromQuizBtn")
    ?.addEventListener(
      "click",
      exitQuiz
    );


  /* RESULTS */

  document
    .getElementById("reviewAnswersBtn")
    ?.addEventListener(
      "click",
      openReview
    );


  document
    .getElementById("retakeQuizBtn")
    ?.addEventListener(
      "click",
      retakeQuiz
    );


  document
    .getElementById("backToDashboardBtn")
    ?.addEventListener(
      "click",
      openDashboard
    );


  document
    .getElementById("backToResultBtn")
    ?.addEventListener(
      "click",
      openResultScreen
    );


  document
    .getElementById(
      "backToDashboardFromReviewBtn"
    )
    ?.addEventListener(
      "click",
      openDashboard
    );


  document
    .getElementById("reviewRetakeBtn")
    ?.addEventListener(
      "click",
      retakeQuiz
    );


  /* RESULTS PAGE */

  document
    .getElementById("backFromResultsBtn")
    ?.addEventListener(
      "click",
      openDashboard
    );


  /* ACCOUNT */

  document
    .getElementById("backFromAccountBtn")
    ?.addEventListener(
      "click",
      openDashboard
    );


  document
    .getElementById("logoutBtn")
    ?.addEventListener(
      "click",
      openLogoutModal
    );


  /* LOGOUT MODAL */

  document
    .getElementById("cancelLogoutBtn")
    ?.addEventListener(
      "click",
      closeLogoutModal
    );


  document
    .getElementById("confirmLogoutBtn")
    ?.addEventListener(
      "click",
      performLogout
    );


  /* ADMIN */

  document
    .getElementById("adminLogoutBtn")
    ?.addEventListener(
      "click",
      performLogout
    );


  document
    .getElementById("addQuestionForm")
    ?.addEventListener(
      "submit",
      addQuestion
    );


  document
    .getElementById("importBtn")
    ?.addEventListener(
      "click",
      importQuestions
    );


  document
    .getElementById("exportBtn")
    ?.addEventListener(
      "click",
      exportQuestions
    );


}


/* =========================================================
   BASIC SCREEN MANAGEMENT
   ========================================================= */

function showScreen(screenId) {

  document
    .querySelectorAll(".container")
    .forEach(element => {

      element.classList.add("hidden");

    });


  const target =
    document.getElementById(screenId);


  if (target) {

    target.classList.remove("hidden");

  }


  updateNavigation(screenId);

}


function updateNavigation(screenId) {

  const navbar =
    document.getElementById("topNavbar");

  const footer =
    document.getElementById("appFooter");


  const authScreens = [
    "loginScreen",
    "signupScreen"
  ];


  const shouldHideNav =
    authScreens.includes(screenId);


  if (navbar) {

    navbar.classList.toggle(
      "hidden",
      shouldHideNav
    );

  }


  if (footer) {

    footer.classList.toggle(
      "hidden",
      shouldHideNav
    );

  }


  document
    .querySelectorAll(".nav-link")
    .forEach(link => {

      link.classList.remove("active");

    });


  if (screenId === "dashboardScreen") {

    document
      .getElementById("navDashboardBtn")
      ?.classList.add("active");

  }


  if (screenId === "userResultsScreen") {

    document
      .getElementById("navResultsBtn")
      ?.classList.add("active");

  }


  if (screenId === "accountScreen") {

    document
      .getElementById("navAccountBtn")
      ?.classList.add("active");

  }

}


/* =========================================================
   ERROR HELPERS
   ========================================================= */

function showError(id, message) {

  const element =
    document.getElementById(id);


  if (!element) return;


  element.textContent = message;

  element.classList.remove("hidden");

}


function hideError(id) {

  const element =
    document.getElementById(id);


  if (element) {

    element.classList.add("hidden");

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(event) {

  event.preventDefault();

  hideError("loginError");


  if (!firebaseReady || !db) {

    showError(
      "loginError",
      "Firebase is not connected. Please check your internet connection and try again."
    );

    return;

  }


  const username =
    document
      .getElementById("loginUsername")
      .value
      .trim()
      .toLowerCase();


  const password =
    document
      .getElementById("loginPassword")
      .value;


  if (!username || !password) {

    showError(
      "loginError",
      "Please enter username and password."
    );

    return;

  }


  try {

    const snapshot =
      await db
        .collection("users")
        .where(
          "username",
          "==",
          username
        )
        .limit(1)
        .get();


    if (snapshot.empty) {

      showError(
        "loginError",
        "Username or password is incorrect."
      );

      return;

    }


    const doc =
      snapshot.docs[0];


    const user =
      doc.data();


    if (user.password !== password) {

      showError(
        "loginError",
        "Username or password is incorrect."
      );

      return;

    }


    currentUser = {

      id: doc.id,

      ...user

    };


    localStorage.setItem(
      "mcqCurrentUser",
      JSON.stringify(currentUser)
    );


    await updateLastLogin();


    await afterLogin();


  } catch (error) {

    console.error(
      "Login error:",
      error
    );


    showError(
      "loginError",
      "Login failed. Please try again."
    );

  }

}


/* =========================================================
   SIGNUP
   ========================================================= */

async function handleSignup(event) {

  event.preventDefault();

  hideError("signupError");

  hideError("signupSuccess");


  if (!firebaseReady || !db) {

    showError(
      "signupError",
      "Firebase is not connected."
    );

    return;

  }


  const name =
    document
      .getElementById("signupName")
      .value
      .trim();


  const username =
    document
      .getElementById("signupUsername")
      .value
      .trim()
      .toLowerCase();


  const password =
    document
      .getElementById("signupPassword")
      .value;


  if (
    !name ||
    !username ||
    !password
  ) {

    showError(
      "signupError",
      "Please fill in all fields."
    );

    return;

  }


  if (password.length < 4) {

    showError(
      "signupError",
      "Password must contain at least 4 characters."
    );

    return;

  }


  try {

    const existing =
      await db
        .collection("users")
        .where(
          "username",
          "==",
          username
        )
        .limit(1)
        .get();


    if (!existing.empty) {

      showError(
        "signupError",
        "That username is already registered."
      );

      return;

    }


    const userData = {

      name,

      username,

      password,

      role: "student",

      createdAt:
        firebase.firestore.FieldValue.serverTimestamp(),

      lastLogin:
        firebase.firestore.FieldValue.serverTimestamp()

    };


    const userRef =
      await db
        .collection("users")
        .add(userData);


    currentUser = {

      id: userRef.id,

      ...userData

    };


    localStorage.setItem(
      "mcqCurrentUser",
      JSON.stringify(currentUser)
    );


    const success =
      document.getElementById(
        "signupSuccess"
      );


    if (success) {

      success.textContent =
        "Account created successfully.";

      success.classList.remove("hidden");

    }


    setTimeout(
      afterLogin,
      700
    );


  } catch (error) {

    console.error(
      "Signup error:",
      error
    );


    showError(
      "signupError",
      "Unable to create account."
    );

  }

}


/* =========================================================
   RESTORE SESSION
   ========================================================= */

async function restoreSession() {

  const saved =
    localStorage.getItem(
      "mcqCurrentUser"
    );


  if (!saved) return false;


  try {

    currentUser =
      JSON.parse(saved);


    if (
      !currentUser ||
      !currentUser.id
    ) {

      localStorage.removeItem(
        "mcqCurrentUser"
      );

      return false;

    }


    return true;


  } catch {

    localStorage.removeItem(
      "mcqCurrentUser"
    );

    return false;

  }

}


/* =========================================================
   AFTER LOGIN
   ========================================================= */

async function afterLogin() {

  updateUserInterface();

  openDashboard();

  await loadDashboardStats();

}


/* =========================================================
   USER UI
   ========================================================= */

function updateUserInterface() {

  if (!currentUser) return;


  const name =
    currentUser.name ||
    currentUser.username ||
    "Student";


  const username =
    currentUser.username ||
    "";


  setText(
    "userName",
    name
  );


  setText(
    "navUserName",
    name
  );


  setText(
    "profileName",
    name
  );


  setText(
    "profileFullName",
    name
  );


  setText(
    "profileUsername",
    username
  );


  setText(
    "profileQuizCount",
    "0"
  );


  setText(
    "profileBestScore",
    "0%"
  );


  const initial =
    name
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "U";


  setText(
    "navAvatar",
    initial
  );


  setText(
    "profileAvatar",
    initial
  );

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function openDashboard() {

  if (!currentUser) {

    showScreen("loginScreen");

    return;

  }


  showScreen(
    "dashboardScreen"
  );


  updateUserInterface();

  loadDashboardStats();

}


/* =========================================================
   NCSM SUBJECT SETUP
   ========================================================= */

function setupNCSMSubjectSelector() {

  const container =
    document.getElementById(
      "ncsmSubjects"
    );


  if (!container) return;


  container.innerHTML = "";


  NCSM_SUBJECTS.forEach(
    (subject, index) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "subject-card";


      const chapterId =
        "chapters-" +
        index;


      card.innerHTML = `

        <div class="subject-top">

          <div class="subject-number">
            ${String(index + 1).padStart(2, "0")}
          </div>

          <div class="subject-title-wrap">

            <h3>
              ${escapeHTML(subject)}
            </h3>

            <p>
              5 chapters available
            </p>

          </div>

          <button
            type="button"
            class="chapter-toggle"
            data-target="${chapterId}"
          >
            View Chapters
          </button>

        </div>

        <div
          class="chapter-list hidden"
          id="${chapterId}"
        >

          ${NCSM_CHAPTERS.map(
            (chapter, chapterIndex) => `

              <div class="chapter-card">

                <div class="chapter-details">

                  <div class="chapter-number">
                    ${chapterIndex + 1}
                  </div>

                  <div>

                    <strong>
                      ${escapeHTML(chapter)}
                    </strong>

                    <small>
                      Demo chapter
                    </small>

                  </div>

                </div>

                <button
                  type="button"
                  class="btn btn-primary chapter-start-btn"
                  data-subject="${escapeHTML(subject)}"
                  data-chapter="${escapeHTML(chapter)}"
                >
                  Start
                </button>

              </div>

            `
          ).join("")}

        </div>

      `;


      container.appendChild(card);

    }
  );


  container
    .querySelectorAll(".chapter-toggle")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const targetId =
            button.dataset.target;


          const target =
            document.getElementById(
              targetId
            );


          if (!target) return;


          const isHidden =
            target.classList.contains(
              "hidden"
            );


          target.classList.toggle(
            "hidden"
          );


          button.textContent =
            isHidden
              ? "Hide Chapters"
              : "View Chapters";

        }
      );

    });


  container
    .querySelectorAll(
      ".chapter-start-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          startNCSMChapter(
            button.dataset.subject,
            button.dataset.chapter
          );

        }
      );

    });

}


/* =========================================================
   OPEN NCSM
   ========================================================= */

function openNCSM() {

  if (!currentUser) {

    showScreen("loginScreen");

    return;

  }


  showScreen("ncsmScreen");

}


/* =========================================================
   START NCSM CHAPTER
   ========================================================= */

async function startNCSMChapter(
  subject,
  chapter
) {

  currentCategory =
    "NCSM";

  currentSubject =
    subject;

  currentChapter =
    chapter;

  currentMode =
    "exam";


  await startQuiz(
    "NCSM",
    "exam",
    subject,
    chapter
  );

}


/* =========================================================
   GENERAL / COMPETITIVE QUIZ BUTTONS
   ========================================================= */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        ".practice-btn, .exam-btn"
      );


    if (!button) return;


    const category =
      button.dataset.cat;


    const mode =
      button.dataset.mode;


    startQuiz(
      category,
      mode,
      "",
      ""
    );

  }
);


/* =========================================================
   START QUIZ
   ========================================================= */

async function startQuiz(
  category,
  mode = "exam",
  subject = "",
  chapter = ""
) {

  if (!currentUser) {

    showScreen("loginScreen");

    return;

  }


  currentCategory =
    category;

  currentMode =
    mode;

  currentSubject =
    subject;

  currentChapter =
    chapter;


  try {

    let questions = [];


    if (
      firebaseReady &&
      db
    ) {

      let query =
        db
          .collection("questions")
          .where(
            "category",
            "==",
            category
          );


      const snapshot =
        await query.get();


      questions =
        snapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data()
          })
        );

    }


    /*
     * Filter NCSM subject/chapter
     */

    if (
      category === "NCSM" &&
      subject
    ) {

      questions =
        questions.filter(
          question =>
            question.subject === subject
        );

    }


    if (
      category === "NCSM" &&
      chapter
    ) {

      questions =
        questions.filter(
          question =>
            question.chapter === chapter
        );

    }


    /*
     * Shuffle
     */

    questions =
      shuffleArray(
        questions
      );


    /*
     * Practice / exam question count
     */

    const questionLimit =
      mode === "practice"
        ? 10
        : 20;


    currentQuiz =
      questions.slice(
        0,
        questionLimit
      );


    /*
     * If Firebase has no questions,
     * create a small demo question set.
     */

    if (
      currentQuiz.length === 0
    ) {

      currentQuiz =
        createDemoQuestions(
          category,
          subject,
          chapter,
          questionLimit
        );

    }


    currentQuestionIndex = 0;


    userAnswers =
      new Array(
        currentQuiz.length
      ).fill(null);


    const title =
      buildQuizTitle(
        category,
        mode,
        subject,
        chapter
      );


    setText(
      "quizTitle",
      title
    );


    setText(
      "totalQuestions",
      currentQuiz.length
    );


    showScreen("quizScreen");


    renderQuestion();


  } catch (error) {

    console.error(
      "Quiz loading error:",
      error
    );


    currentQuiz =
      createDemoQuestions(
        category,
        subject,
        chapter,
        mode === "practice"
          ? 10
          : 5
      );


    currentQuestionIndex = 0;

    userAnswers =
      new Array(
        currentQuiz.length
      ).fill(null);


    showScreen("quizScreen");

    renderQuestion();

  }

}


/* =========================================================
   QUIZ TITLE
   ========================================================= */

function buildQuizTitle(
  category,
  mode,
  subject,
  chapter
) {

  if (category === "NCSM") {

    return (
      "NCSM • " +
      subject +
      " • " +
      chapter
    );

  }


  return (
    category +
    " • " +
    (
      mode === "practice"
        ? "Practice Mode"
        : "Mock Exam"
    )
  );

}


/* =========================================================
   CREATE DEMO QUESTIONS
   ========================================================= */

function createDemoQuestions(
  category,
  subject,
  chapter,
  count
) {

  const questions = [];


  for (
    let i = 1;
    i <= count;
    i++
  ) {

    questions.push({

      id:
        "demo-" +
        Date.now() +
        "-" +
        i,

      question:
        category === "NCSM"
          ? `${subject} - ${chapter}: Demo Question ${i}`
          : `${category}: Demo Question ${i}`,

      options: [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],

      correct: 0,

      explanation:
        "This is a demonstration question. Add real questions from the Admin Panel.",

      category,

      subject,

      chapter

    });

  }


  return questions;

}


/* =========================================================
   RENDER QUESTION
   ========================================================= */

function renderQuestion() {

  if (
    !currentQuiz.length
  ) return;


  const question =
    currentQuiz[
      currentQuestionIndex
    ];


  setText(
    "currentQuestion",
    currentQuestionIndex + 1
  );


  setText(
    "totalQuestions",
    currentQuiz.length
  );


  setText(
    "questionText",
    question.question ||
    "Question unavailable"
  );


  const optionsContainer =
    document.getElementById(
      "optionsContainer"
    );


  if (!optionsContainer) return;


  optionsContainer.innerHTML = "";


  const options =
    Array.isArray(
      question.options
    )
      ? question.options
      : [];


  const letters = [
    "A",
    "B",
    "C",
    "D"
  ];


  options.forEach(
    (option, index) => {

      const button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.className =
        "option-btn";


      if (
        userAnswers[
          currentQuestionIndex
        ] === index
      ) {

        button.classList.add(
          "selected"
        );

      }


      button.innerHTML = `

        <span class="option-letter">
          ${letters[index] || index + 1}
        </span>

        <span>
          ${escapeHTML(
            String(option)
          )}
        </span>

      `;


      button.addEventListener(
        "click",
        () => {

          selectAnswer(index);

        }
      );


      optionsContainer.appendChild(
        button
      );

    }
  );


  renderFeedback();


  updateQuizProgress();


  const previous =
    document.getElementById(
      "prevBtn"
    );


  const next =
    document.getElementById(
      "nextBtn"
    );


  if (previous) {

    previous.disabled =
      currentQuestionIndex === 0;

  }


  if (next) {

    next.textContent =
      currentQuestionIndex ===
      currentQuiz.length - 1
        ? "Finish Quiz"
        : "Next →";

  }

}


/* =========================================================
   SELECT ANSWER
   ========================================================= */

function selectAnswer(index) {

  userAnswers[
    currentQuestionIndex
  ] = index;


  renderQuestion();


  /*
   * Practice mode shows explanation immediately.
   */

  if (
    currentMode === "practice"
  ) {

    renderFeedback();

  }

}


/* =========================================================
   FEEDBACK
   ========================================================= */

function renderFeedback() {

  const feedback =
    document.getElementById(
      "feedback"
    );


  if (!feedback) return;


  const question =
    currentQuiz[
      currentQuestionIndex
    ];


  const answer =
    userAnswers[
      currentQuestionIndex
    ];


  if (
    currentMode !== "practice" ||
    answer === null ||
    answer === undefined
  ) {

    feedback.classList.add(
      "hidden"
    );

    feedback.classList.remove(
      "correct",
      "incorrect"
    );

    feedback.innerHTML = "";

    return;

  }


  const correct =
    Number(question.correct);


  const isCorrect =
    answer === correct;


  feedback.classList.remove(
    "hidden"
  );


  feedback.classList.remove(
    "correct",
    "incorrect"
  );


  feedback.classList.add(
    isCorrect
      ? "correct"
      : "incorrect"
  );


  if (isCorrect) {

    feedback.innerHTML =
      `<strong>Correct!</strong> ` +
      `${escapeHTML(
        question.explanation ||
        "Good answer."
      )}`;

  } else {

    const correctText =
      question.options &&
      question.options[correct]
        ? question.options[correct]
        : "Correct answer";


    feedback.innerHTML =
      `<strong>Incorrect.</strong> ` +
      `Correct answer: ` +
      `<strong>${escapeHTML(
        String(correctText)
      )}</strong><br>` +
      `${escapeHTML(
        question.explanation ||
        ""
      )}`;

  }

}


/* =========================================================
   QUIZ PROGRESS
   ========================================================= */

function updateQuizProgress() {

  const bar =
    document.getElementById(
      "quizProgressBar"
    );


  if (!bar) return;


  const total =
    currentQuiz.length;


  const current =
    currentQuestionIndex + 1;


  const percentage =
    total
      ? (current / total) * 100
      : 0;


  bar.style.width =
    percentage + "%";

}


/* =========================================================
   PREVIOUS QUESTION
   ========================================================= */

function previousQuestion() {

  if (
    currentQuestionIndex <= 0
  ) return;


  currentQuestionIndex--;

  renderQuestion();

}


/* =========================================================
   NEXT QUESTION
   ========================================================= */

function nextQuestion() {

  if (
    currentQuestionIndex <
    currentQuiz.length - 1
  ) {

    currentQuestionIndex++;

    renderQuestion();

    return;

  }


  finishQuiz();

}


/* =========================================================
   FINISH QUIZ
   ========================================================= */

async function finishQuiz() {

  const total =
    currentQuiz.length;


  let score = 0;


  currentQuiz.forEach(
    (question, index) => {

      const answer =
        userAnswers[index];


      if (
        answer !== null &&
        Number(answer) ===
        Number(question.correct)
      ) {

        score++;

      }

    }
  );


  const percentage =
    total
      ? Math.round(
          (score / total) * 100
        )
      : 0;


  lastQuizResult = {

    category:
      currentCategory,

    subject:
      currentSubject,

    chapter:
      currentChapter,

    mode:
      currentMode,

    score,

    total,

    percentage,

    answers:
      [...userAnswers],

    questions:
      [...currentQuiz],

    completedAt:
      new Date().toISOString()

  };


  await saveQuizResult(
    lastQuizResult
  );


  showResult(
    lastQuizResult
  );

}


/* =========================================================
   SHOW RESULT
   ========================================================= */

function showResult(result) {

  const score =
    `${result.score}/${result.total}`;


  setText(
    "scoreDisplay",
    score
  );


  let message = "";


  if (
    result.percentage >= 80
  ) {

    message =
      `You scored ${result.percentage}%.`;

  } else if (
    result.percentage >= 50
  ) {

    message =
      `You scored ${result.percentage}%. Keep practicing.`;

  } else {

    message =
      `You scored ${result.percentage}%. Review the answers and try again.`;

  }


  setText(
    "resultMessage",
    message
  );


  const recommendation =
    document.getElementById(
      "recommendation"
    );


  if (recommendation) {

    recommendation.innerHTML = `

      <strong>
        ${escapeHTML(
          result.category
        )}
      </strong>

      ${
        result.subject
          ? " • " +
            escapeHTML(
              result.subject
            )
          : ""
      }

      ${
        result.chapter
          ? " • " +
            escapeHTML(
              result.chapter
            )
          : ""
      }

      <br>

      ${
        result.mode === "practice"
          ? "Practice mode gives immediate explanations."
          : "Review your answers to identify areas that need more practice."
      }

    `;

  }


  showScreen("resultScreen");

}


/* =========================================================
   OPEN RESULT SCREEN
   ========================================================= */

function openResultScreen() {

  if (!lastQuizResult) {

    openDashboard();

    return;

  }


  showResult(
    lastQuizResult
  );

}


/* =========================================================
   REVIEW
   ========================================================= */

function openReview() {

  if (!lastQuizResult) return;


  const container =
    document.getElementById(
      "reviewContainer"
    );


  if (!container) return;


  container.innerHTML = "";


  lastQuizResult.questions
    .forEach(
      (question, index) => {

        const item =
          document.createElement(
            "div"
          );


        item.className =
          "review-item";


        const selected =
          lastQuizResult.answers[
            index
          ];


        const correct =
          Number(
            question.correct
          );


        const isCorrect =
          Number(selected) ===
          correct;


        const selectedText =
          selected !== null &&
          question.options &&
          question.options[selected]
            ? question.options[selected]
            : "Not answered";


        const correctText =
          question.options &&
          question.options[correct]
            ? question.options[correct]
            : "Unavailable";


        item.innerHTML = `

          <div class="review-question">

            <strong>
              Question ${index + 1}
            </strong>

            <p>
              ${escapeHTML(
                question.question || ""
              )}
            </p>

          </div>

          <div class="review-answer">

            <div class="${
              isCorrect
                ? "answer-correct"
                : "answer-wrong"
            }">

              Your Answer:
              ${escapeHTML(
                String(selectedText)
              )}

            </div>

            <div class="answer-correct"
                 style="margin-top:6px;">

              Correct Answer:
              ${escapeHTML(
                String(correctText)
              )}

            </div>

            ${
              question.explanation
                ? `
                  <div
                    style="
                      margin-top:8px;
                      color:#64748b;
                      font-size:12px;
                    "
                  >
                    ${escapeHTML(
                      question.explanation
                    )}
                  </div>
                `
                : ""
            }

          </div>

        `;


        container.appendChild(
          item
        );

      }
    );


  showScreen(
    "reviewScreen"
  );

}


/* =========================================================
   RETAKE QUIZ
   ========================================================= */

function retakeQuiz() {

  if (!lastQuizResult) {

    openDashboard();

    return;

  }


  startQuiz(
    lastQuizResult.category,
    lastQuizResult.mode,
    lastQuizResult.subject,
    lastQuizResult.chapter
  );

}


/* =========================================================
   EXIT QUIZ
   ========================================================= */

function exitQuiz() {

  const shouldExit =
    confirm(
      "Are you sure you want to exit this quiz? Your current progress will not be saved."
    );


  if (shouldExit) {

    openDashboard();

  }

}


/* =========================================================
   SAVE RESULT
   ========================================================= */

async function saveQuizResult(
  result
) {

  if (
    !firebaseReady ||
    !db ||
    !currentUser
  ) return;


  try {

    await db
      .collection("results")
      .add({

        userId:
          currentUser.id,

        username:
          currentUser.username ||
          "",

        name:
          currentUser.name ||
          "",

        category:
          result.category,

        subject:
          result.subject,

        chapter:
          result.chapter,

        mode:
          result.mode,

        score:
          result.score,

        total:
          result.total,

        percentage:
          result.percentage,

        completedAt:
          firebase.firestore.FieldValue.serverTimestamp()

      });


  } catch (error) {

    console.error(
      "Could not save result:",
      error
    );

  }

}


/* =========================================================
   LOAD DASHBOARD STATS
   ========================================================= */

async function loadDashboardStats() {

  if (
    !currentUser ||
    !firebaseReady ||
    !db
  ) {

    return;

  }


  try {

    const snapshot =
      await db
        .collection("results")
        .where(
          "userId",
          "==",
          currentUser.id
        )
        .get();


    const results =
      snapshot.docs.map(
        doc => doc.data()
      );


    const quizzes =
      results.length;


    const questions =
      results.reduce(
        (
          total,
          result
        ) =>
          total +
          Number(
            result.total || 0
          ),
        0
      );


    const average =
      quizzes
        ? Math.round(
            results.reduce(
              (
                total,
                result
              ) =>
                total +
                Number(
                  result.percentage ||
                  0
                ),
              0
            ) / quizzes
          )
        : 0;


    const best =
      quizzes
        ? Math.max(
            ...results.map(
              result =>
                Number(
                  result.percentage ||
                  0
                )
            )
          )
        : 0;


    setText(
      "statQuizzes",
      quizzes
    );


    setText(
      "statQuestions",
      questions
    );


    setText(
      "statScore",
      average + "%"
    );


    setText(
      "statBest",
      best + "%"
    );


    setText(
      "profileQuizCount",
      quizzes
    );


    setText(
      "profileBestScore",
      best + "%"
    );


  } catch (error) {

    console.error(
      "Dashboard stats error:",
      error
    );

  }

}


/* =========================================================
   USER RESULTS PAGE
   ========================================================= */

async function openUserResults() {

  if (!currentUser) {

    showScreen("loginScreen");

    return;

  }


  showScreen(
    "userResultsScreen"
  );


  const container =
    document.getElementById(
      "userResultsContainer"
    );


  if (!container) return;


  container.innerHTML =
    `<div class="empty-state">
      <div class="empty-state-icon">⏳</div>
      <p>Loading results...</p>
    </div>`;


  if (
    !firebaseReady ||
    !db
  ) {

    container.innerHTML =
      `<div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <h3>Results unavailable</h3>
        <p>Firebase is not connected.</p>
      </div>`;

    return;

  }


  try {

    const snapshot =
      await db
        .collection("results")
        .where(
          "userId",
          "==",
          currentUser.id
        )
        .get();


    const results =
      snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort(
          (
            a,
            b
          ) => {

            const dateA =
              getResultDate(a);

            const dateB =
              getResultDate(b);

            return dateB - dateA;

          }
        );


    updateResultSummary(
      results
    );


    if (!results.length) {

      container.innerHTML =
        `<div class="empty-state">

          <div class="empty-state-icon">
            📊
          </div>

          <h3>
            No quiz results yet
          </h3>

          <p>
            Complete your first quiz to see your performance here.
          </p>

        </div>`;

      return;

    }


    container.innerHTML = "";


    results.forEach(
      result => {

        const card =
          document.createElement(
            "div"
          );


        card.className =
          "user-result-card";


        card.innerHTML = `

          <div class="user-result-main">

            <strong>
              ${escapeHTML(
                result.category ||
                "Quiz"
              )}
            </strong>

            <span>

              ${
                result.subject
                  ? escapeHTML(
                      result.subject
                    ) + " • "
                  : ""
              }

              ${
                result.chapter
                  ? escapeHTML(
                      result.chapter
                    ) + " • "
                  : ""
              }

              ${
                result.mode === "practice"
                  ? "Practice"
                  : "Mock Test"
              }

              ${
                getResultDate(result)
                  ? " • " +
                    formatDate(
                      getResultDate(
                        result
                      )
                    )
                  : ""
              }

            </span>

          </div>


          <div class="user-result-score">

            ${Number(
              result.percentage || 0
            )}%

          </div>

        `;


        container.appendChild(
          card
        );

      }
    );


  } catch (error) {

    console.error(
      "Results error:",
      error
    );


    container.innerHTML =
      `<div class="empty-state">

        <div class="empty-state-icon">
          ⚠️
        </div>

        <h3>
          Could not load results
        </h3>

        <p>
          Please try again.
        </p>

      </div>`;

  }

}


/* =========================================================
   RESULT SUMMARY
   ========================================================= */

function updateResultSummary(
  results
) {

  const total =
    results.length;


  const average =
    total
      ? Math.round(
          results.reduce(
            (
              sum,
              result
            ) =>
              sum +
              Number(
                result.percentage ||
                0
              ),
            0
          ) / total
        )
      : 0;


  const best =
    total
      ? Math.max(
          ...results.map(
            result =>
              Number(
                result.percentage ||
                0
              )
          )
        )
      : 0;


  const categories =
    new Set(
      results.map(
        result =>
          result.category
      )
    ).size;


  setText(
    "resultTotalQuizzes",
    total
  );


  setText(
    "resultAverage",
    average + "%"
  );


  setText(
    "resultBestScore",
    best + "%"
  );


  setText(
    "resultSubjects",
    categories
  );


}


/* =========================================================
   ACCOUNT
   ========================================================= */

async function openAccount() {

  if (!currentUser) {

    showScreen("loginScreen");

    return;

  }


  showScreen(
    "accountScreen"
  );


  updateUserInterface();


  await loadDashboardStats();

}


/* =========================================================
   LOGOUT MODAL
   ========================================================= */

function openLogoutModal() {

  const modal =
    document.getElementById(
      "logoutModal"
    );


  if (modal) {

    modal.classList.remove(
      "hidden"
    );

  }

}


function closeLogoutModal() {

  const modal =
    document.getElementById(
      "logoutModal"
    );


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

function performLogout() {

  closeLogoutModal();


  currentUser = null;

  currentQuiz = [];

  userAnswers = [];

  lastQuizResult = null;


  localStorage.removeItem(
    "mcqCurrentUser"
  );


  document
    .getElementById("loginForm")
    ?.reset();


  showScreen(
    "loginScreen"
  );

}


/* =========================================================
   ADMIN CATEGORY
   ========================================================= */

function setupAdminCategorySelector() {

  const category =
    document.getElementById(
      "newCategory"
    );


  if (!category) return;


  category.addEventListener(
    "change",
    updateAdminFields
  );


  updateAdminFields();

}


/* =========================================================
   ADMIN SUBJECTS
   ========================================================= */

function updateAdminFields() {

  const category =
    document.getElementById(
      "newCategory"
    )?.value;


  const subjectGroup =
    document.getElementById(
      "subjectGroup"
    );


  const chapterGroup =
    document.getElementById(
      "chapterGroup"
    );


  if (
    category === "NCSM"
  ) {

    subjectGroup
      ?.classList.remove(
        "hidden"
      );


    chapterGroup
      ?.classList.remove(
        "hidden"
      );


    populateAdminSubjects();


  } else {

    subjectGroup
      ?.classList.add(
        "hidden"
      );


    chapterGroup
      ?.classList.add(
        "hidden"
      );

  }

}


/* =========================================================
   POPULATE ADMIN SUBJECTS
   ========================================================= */

function populateAdminSubjects() {

  const select =
    document.getElementById(
      "newSubject"
    );


  if (!select) return;


  select.innerHTML =
    `<option value="">
      Select Subject
    </option>`;


  NCSM_SUBJECTS.forEach(
    subject => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        subject;


      option.textContent =
        subject;


      select.appendChild(
        option
      );

    }
  );


  populateAdminChapters();

}


/* =========================================================
   ADMIN CHAPTERS
   ========================================================= */

function populateAdminChapters() {

  const select =
    document.getElementById(
      "newChapter"
    );


  if (!select) return;


  select.innerHTML =
    `<option value="">
      Select Chapter
    </option>`;


  NCSM_CHAPTERS.forEach(
    chapter => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        chapter;


      option.textContent =
        chapter;


      select.appendChild(
        option
      );

    }
  );

}


/* =========================================================
   ADD QUESTION
   ========================================================= */

async function addQuestion(
  event
) {

  event.preventDefault();


  if (!firebaseReady || !db) {

    alert(
      "Firebase is not connected."
    );

    return;

  }


  if (
    !currentUser ||
    currentUser.role !== "admin"
  ) {

    alert(
      "Admin access required."
    );

    return;

  }


  const category =
    document.getElementById(
      "newCategory"
    ).value;


  const subject =
    document.getElementById(
      "newSubject"
    ).value;


  const chapter =
    document.getElementById(
      "newChapter"
    ).value;


  const question =
    document.getElementById(
      "newQuestion"
    ).value
    .trim();


  const options = [

    document.getElementById(
      "opt1"
    ).value.trim(),

    document.getElementById(
      "opt2"
    ).value.trim(),

    document.getElementById(
      "opt3"
    ).value.trim(),

    document.getElementById(
      "opt4"
    ).value.trim()

  ];


  const correct =
    Number(
      document.getElementById(
        "newCorrect"
      ).value
    );


  const explanation =
    document.getElementById(
      "newExplanation"
    ).value.trim();


  if (
    category === "NCSM" &&
    (!subject || !chapter)
  ) {

    alert(
      "Please select an NCSM subject and chapter."
    );

    return;

  }


  if (
    correct < 0 ||
    correct > 3
  ) {

    alert(
      "Correct index must be between 0 and 3."
    );

    return;

  }


  try {

    await db
      .collection("questions")
      .add({

        question,

        options,

        correct,

        explanation,

        category,

        subject:
          category === "NCSM"
            ? subject
            : "",

        chapter:
          category === "NCSM"
            ? chapter
            : "",

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        createdBy:
          currentUser.id

      });


    alert(
      "Question added successfully."
    );


    document
      .getElementById(
        "addQuestionForm"
      )
      .reset();


    updateAdminFields();


  } catch (error) {

    console.error(
      "Add question error:",
      error
    );


    alert(
      "Could not add question."
    );

  }

}


/* =========================================================
   IMPORT QUESTIONS
   ========================================================= */

async function importQuestions() {

  if (!firebaseReady || !db) {

    alert(
      "Firebase is not connected."
    );

    return;

  }


  if (
    !currentUser ||
    currentUser.role !== "admin"
  ) {

    alert(
      "Admin access required."
    );

    return;

  }


  const textarea =
    document.getElementById(
      "importTextarea"
    );


  const text =
    textarea.value.trim();


  if (!text) {

    alert(
      "Paste a JSON array first."
    );

    return;

  }


  try {

    const questions =
      JSON.parse(text);


    if (
      !Array.isArray(
        questions
      )
    ) {

      throw new Error(
        "JSON must be an array."
      );

    }


    let count = 0;


    for (
      const question
      of questions
    ) {

      if (
        !question.question ||
        !Array.isArray(
          question.options
        ) ||
        question.options.length !== 4
      ) {

        continue;

      }


      await db
        .collection("questions")
        .add({

          question:
            question.question,

          options:
            question.options,

          correct:
            Number(
              question.correct || 0
            ),

          category:
            question.category ||
            "General Knowledge",

          subject:
            question.subject ||
            "",

          chapter:
            question.chapter ||
            "",

          explanation:
            question.explanation ||
            "",

          createdAt:
            firebase.firestore.FieldValue.serverTimestamp(),

          createdBy:
            currentUser.id

        });


      count++;

    }


    alert(
      `${count} question(s) imported successfully.`
    );


    textarea.value = "";


  } catch (error) {

    console.error(
      "Import error:",
      error
    );


    alert(
      "Invalid JSON or import failed."
    );

  }

}


/* =========================================================
   EXPORT QUESTIONS
   ========================================================= */

async function exportQuestions() {

  if (!firebaseReady || !db) {

    alert(
      "Firebase is not connected."
    );

    return;

  }


  if (
    !currentUser ||
    currentUser.role !== "admin"
  ) {

    alert(
      "Admin access required."
    );

    return;

  }


  try {

    const snapshot =
      await db
        .collection("questions")
        .get();


    const questions =
      snapshot.docs.map(
        doc => {

          const data =
            doc.data();


          return {

            id:
              doc.id,

            question:
              data.question || "",

            options:
              data.options || [],

            correct:
              data.correct ?? 0,

            category:
              data.category || "",

            subject:
              data.subject || "",

            chapter:
              data.chapter || "",

            explanation:
              data.explanation || ""

          };

        }
      );


    const blob =
      new Blob(
        [
          JSON.stringify(
            questions,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const anchor =
      document.createElement(
        "a"
      );


    anchor.href =
      url;


    anchor.download =
      "mcq_questions.json";


    document.body.appendChild(
      anchor
    );


    anchor.click();


    anchor.remove();


    URL.revokeObjectURL(
      url
    );


  } catch (error) {

    console.error(
      "Export error:",
      error
    );


    alert(
      "Could not export questions."
    );

  }

}


/* =========================================================
   ADMIN SCREEN
   ========================================================= */

async function openAdmin() {

  if (!currentUser) {

    showScreen(
      "loginScreen"
    );

    return;

  }


  if (
    currentUser.role !== "admin"
  ) {

    alert(
      "Admin access required."
    );

    return;

  }


  showScreen(
    "adminScreen"
  );


  await loadAdminStats();

}


/* =========================================================
   ADMIN STATISTICS
   ========================================================= */

async function loadAdminStats() {

  if (
    !firebaseReady ||
    !db
  ) return;


  try {

    const usersSnapshot =
      await db
        .collection("users")
        .get();


    const questionsSnapshot =
      await db
        .collection("questions")
        .get();


    const resultsSnapshot =
      await db
        .collection("results")
        .get();


    const stats =
      document.getElementById(
        "adminStats"
      );


    if (!stats) return;


    stats.innerHTML = `

      <div class="quick-stats">

        <div class="quick-stat">

          <div class="quick-stat-icon">
            👥
          </div>

          <div>

            <strong>
              ${usersSnapshot.size}
            </strong>

            <span>
              Users
            </span>

          </div>

        </div>


        <div class="quick-stat">

          <div class="quick-stat-icon">
            📚
          </div>

          <div>

            <strong>
              ${questionsSnapshot.size}
            </strong>

            <span>
              Questions
            </span>

          </div>

        </div>


        <div class="quick-stat">

          <div class="quick-stat-icon">
            📝
          </div>

          <div>

            <strong>
              ${resultsSnapshot.size}
            </strong>

            <span>
              Attempts
            </span>

          </div>

        </div>

      </div>

    `;


  } catch (error) {

    console.error(
      "Admin stats error:",
      error
    );

  }

}


/* =========================================================
   UPDATE LAST LOGIN
   ========================================================= */

async function updateLastLogin() {

  if (
    !currentUser ||
    !firebaseReady ||
    !db
  ) return;


  try {

    await db
      .collection("users")
      .doc(currentUser.id)
      .update({

        lastLogin:
          firebase.firestore.FieldValue.serverTimestamp()

      });

  } catch (error) {

    console.warn(
      "Could not update last login:",
      error
    );

  }

}


/* =========================================================
   FOOTER
   ========================================================= */

function setupFooter() {

  const year =
    document.getElementById(
      "footerYear"
    );


  if (year) {

    year.textContent =
      " • " +
      new Date().getFullYear();

  }

}


/* =========================================================
   UTILITY: SET TEXT
   ========================================================= */

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


/* =========================================================
   UTILITY: SHUFFLE
   ========================================================= */

function shuffleArray(
  array
) {

  const result =
    [...array];


  for (
    let i =
      result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );


    [
      result[i],
      result[j]
    ] =
    [
      result[j],
      result[i]
    ];

  }


  return result;

}


/* =========================================================
   UTILITY: ESCAPE HTML
   ========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
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
   UTILITY: RESULT DATE
   ========================================================= */

function getResultDate(
  result
) {

  if (
    result.completedAt &&
    typeof result.completedAt.toDate ===
      "function"
  ) {

    return result.completedAt.toDate();

  }


  if (
    result.completedAt
  ) {

    const date =
      new Date(
        result.completedAt
      );


    if (
      !isNaN(
        date.getTime()
      )
    ) {

      return date;

    }

  }


  return new Date(0);

}


/* =========================================================
   UTILITY: FORMAT DATE
   ========================================================= */

function formatDate(
  date
) {

  if (
    !date ||
    isNaN(
      date.getTime()
    )
  ) {

    return "";

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


/* =========================================================
   AUTO RESTORE SESSION
   ========================================================= */

(async function () {

  /*
   * Wait until Firebase initialization
   * has completed.
   */

  if (
    document.readyState ===
    "loading"
  ) {

    await new Promise(
      resolve => {

        document.addEventListener(
          "DOMContentLoaded",
          resolve,
          {
            once: true
          }
        );

      }
    );

  }


  const restored =
    await restoreSession();


  if (
    restored
  ) {

    updateUserInterface();

    openDashboard();

  }

})();
