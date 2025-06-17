let quizMode = 'ja-en';

document.getElementById('mode-select').addEventListener('change', function () {
  quizMode = this.value;
  restartQuiz(); // restart with new mode
});


// Quiz state variables
let vocabulary = [];
let currentQuestion = {};
let options = [];
let score = 0;
let timerInterval;
let timeLeft = 30;
let wrongAnswers = [];
let questionCount = 0;
let currentQuestionIndex = 0;

// Shuffle function
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Sound effects
const correctSound = new Audio('sounds/correct.mp3');
const wrongSound = new Audio('sounds/wrong.mp3');

// Load vocabulary based on selected chapter
document.getElementById('chapter-select').addEventListener('change', function() {
  const chapter = this.value;
  if (chapter) {
    // Reset quiz state variables
    score = 0;
    currentQuestionIndex = 0;
    questionCount = 0;
    wrongAnswers = [];

    // Update score display and reset UI
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('quiz-box').style.display = 'block';
    document.getElementById('result-screen').style.display = 'none';
    document.getElementById('next-btn').style.display = 'inline-block';
    document.getElementById('next-btn').disabled = true;

    // Fetch vocab for selected chapter
    fetch(`json/vocab_chapter_${chapter}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load chapter ${chapter} data.`);
        return response.json();
      })
      .then((data) => {
        vocabulary = data;
        shuffleArray(vocabulary);
        showQuestion(); // Start the quiz
      })
      .catch((error) => {
        alert(`Error loading vocabulary for chapter ${chapter}: ${error.message}`);
        // Clear displayed question on error
        document.getElementById('question').textContent = 'Error loading vocabulary.';
        document.getElementById('options').innerHTML = '';
        document.getElementById('next-btn').disabled = true;
      });
  } else {
    alert('Please select a chapter.');
  }
});

// Show a question or end quiz if done

function showQuestion() {
  clearInterval(timerInterval);
  timeLeft = 30;
  document.getElementById('time').textContent = timeLeft;

  if (currentQuestionIndex >= vocabulary.length) {
    endQuiz();
    return;
  }

  currentQuestion = vocabulary[currentQuestionIndex];
  currentQuestionIndex++;
  questionCount++;
  document.getElementById('question-number').textContent = `Question ${questionCount}`;

  const correctAnswer = quizMode === 'ja-en' ? currentQuestion.english : currentQuestion.japanese;
  const displayedQuestion = quizMode === 'ja-en' ? currentQuestion.japanese : currentQuestion.english;

  let wrongOptions = [];
  let usedAnswers = new Set();
  usedAnswers.add(correctAnswer);

  while (wrongOptions.length < 3) {
    const randomIndex = Math.floor(Math.random() * vocabulary.length);
    const candidate = vocabulary[randomIndex];
    const candidateValue = quizMode === 'ja-en' ? candidate.english : candidate.japanese;
    if (!usedAnswers.has(candidateValue)) {
      wrongOptions.push(candidateValue);
      usedAnswers.add(candidateValue);
    }
  }

  options = [...wrongOptions, correctAnswer];
  options = options.sort(() => 0.5 - Math.random());

  document.getElementById('question').textContent = displayedQuestion;
  const optionsContainer = document.getElementById('options');
  optionsContainer.innerHTML = '';

  options.forEach(option => {
    const div = document.createElement('div');
    div.classList.add('option');
    div.textContent = option;

    div.addEventListener('click', () => {
      clearInterval(timerInterval);
      checkAnswer(option);
    });

    optionsContainer.appendChild(div);
  });

  document.getElementById('next-btn').disabled = true;
  document.getElementById('next-btn').style.display = 'inline-block';
  startTimer();
}


// Check the selected answer for correctness
function checkAnswer(selected) {
  const correct = quizMode === 'ja-en' ? currentQuestion.english : currentQuestion.japanese;
  const optionsDivs = document.querySelectorAll('.option');

  optionsDivs.forEach(div => {
    if (div.textContent === correct) {
      div.style.backgroundColor = 'lightgreen';
    } else if (div.textContent === selected) {
      div.style.backgroundColor = 'salmon';
    }

    div.style.pointerEvents = 'none'; // Disable further clicking
  });

  if (selected === correct) {
    score++;
    correctSound.play();
  } else {
    wrongAnswers.push(currentQuestion);
    wrongSound.play();
  }

  document.getElementById('score').textContent = `Score: ${score}`;

  // Enable next button only if quiz not finished
  if (currentQuestionIndex < vocabulary.length) {
    document.getElementById('next-btn').disabled = false;
  } else {
    // Last question answered, disable next button to avoid confusion
    document.getElementById('next-btn').disabled = true;
    // Instead, automatically show results after a short delay
    setTimeout(endQuiz, 1500);
  }
}

// Start countdown timer for answering
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 30;
  document.getElementById('time').textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('time').textContent = timeLeft;

    if (timeLeft === 0) {
      clearInterval(timerInterval);
      autoFailQuestion();
    }
  }, 1000);
}

// Handle auto-failing question if user doesn't answer in time
function autoFailQuestion() {
  const correct = currentQuestion.english;
  const optionDivs = document.querySelectorAll('.option');
  optionDivs.forEach(div => {
    div.onclick = null;
    if (div.textContent === correct) {
      div.style.backgroundColor = 'lightgreen';
    }
  });
  wrongSound.play();
  wrongAnswers.push(currentQuestion);
  document.getElementById('score').textContent = `Score: ${score}`;
  if (currentQuestionIndex < vocabulary.length) {
    document.getElementById('next-btn').disabled = false;
  } else {
    document.getElementById('next-btn').disabled = true;
    setTimeout(endQuiz, 1500);
  }
}

// Restart the quiz state and UI
function restartQuiz() {
  clearInterval(timerInterval);

  score = 0;
  currentQuestionIndex = 0;
  wrongAnswers = [];
  timeLeft = 30;
  questionCount = 0;

  // Reset UI
  document.getElementById('score').textContent = `Score: ${score}`;
  document.getElementById('quiz-box').style.display = 'block';
  document.getElementById('result-screen').style.display = 'none';
  document.getElementById('next-btn').style.display = 'inline-block';

  showQuestion();
}

// Show result screen after quiz ends
function endQuiz() {
  clearInterval(timerInterval);

  document.getElementById('quiz-box').style.display = 'none';
  document.getElementById('result-screen').style.display = 'block';

  const totalAttempted = questionCount;
  const correctAnswers = score;
  const incorrectAnswers = totalAttempted - correctAnswers;

  document.getElementById('final-score').innerHTML = `
    <div class="result-line"><div class="emoji">🎯</div><div>Attempted <div class="stat attempted">${totalAttempted}</div></div></div>
    <div class="result-line"><div class="emoji">✅</div><div>Correct <div class="stat correct">${correctAnswers}</div></div></div>
    <div class="result-line"><div class="emoji">❌</div><div>Incorrect <div class="stat incorrect">${incorrectAnswers}</div></div></div>
  `;
}

// Event listeners for UI buttons
document.getElementById('next-btn').addEventListener('click', () => {
  showQuestion();
});

document.getElementById('restart-btn-result').addEventListener('click', () => {
  restartQuiz();
});

document.querySelector('button[onclick="restartQuiz()"]').addEventListener('click', () => {
  restartQuiz();
});

// Add vocabulary form handler
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('add-word-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const jp = document.getElementById('japanese-word').value.trim();
    const en = document.getElementById('english-meaning').value.trim();

    if (jp && en) {
      const newEntry = { japanese: jp, english: en };
      vocabulary.push(newEntry);
      saveCustomVocab();
      alert('New word added!');
      this.reset();
    }
  });
});

function saveCustomVocab() {
  localStorage.setItem('customQuizData', JSON.stringify(vocabulary));
}
