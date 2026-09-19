const questions = [
    { text: "Question 1: When did you receive/ know about your tasks?", left: "Just recently", right: "Almost after they were announced", min: 0, max: 100 },
    { text: "Question 2: How are your tasks?", left: "Easy", right: "Difficult", min: 0, max: 100 },
    { text: "Question 3: How are the tasks weigh-demanding for you?", left: "Unnecessary", right: "Necessary", min: 0, max: 100 },
    { text: "Question 4: How are the tasks weigh-demanding by your authorities?", left: "Optional", right: "Compulsory", min: 0, max: 100 },
    { text: "Question 5: When are your tasks deadline submission?", left: "Very close", right: "Further into the future", min: 0, max: 100 },
    { text: "Question 6: How did you prepare for the tasks?", left: "I do them on a whim", right: "I planned carefully ahead", min: 0, max: 100 },
    { text: "Question 7: Is the method you are using your g0-to?", left: "Very rarely", right: "Most often", min: 0, max: 100 },
    { text: "Question 8: Does your usual method works for you?", left: "Not really", right: "Mostly, yes", min: 0, max: 100 },
    { text: "Question 9: Compare to your usual method, how do they affect your performance? For those still using your same method, please leave your scale to the middle. Thanks", left: "It worsen my output", right: "It improved my output", min: 0, max: 100 },
];

const quiz = document.getElementById('quiz');

questions.forEach(q => {
    quiz.innerHTML += `
      <div class="question">
        <p>${q.text}</p>
        <div class="slider-row">
          <span>${q.left}</span>
          <input type="range" min="${q.min}" max="${q.max}" value="${(q.min+q.max)/2}" class="slider">
          <span>${q.right}</span>
        </div>
      </div>`;
});

document.querySelectorAll('.slider').forEach(slider => {
    function update() {
        const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, #4a90d9 ${pct}%, #ddd ${pct}%)`;
    }
    slider.addEventListener('input', update);
    update();
});

const submitBtn = document.createElement('button');
submitBtn.id = 'submit-quiz';
submitBtn.textContent = 'Submit';
quiz.appendChild(submitBtn);

document.getElementById('start').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz').style.display = 'block';
});

submitBtn.addEventListener('click', () => {
    const values = Array.from(document.querySelectorAll('.slider')).map(s => +s.value);
    const type = values.map(v => v >= 50 ? "right" : "left").join("");

    document.getElementById('quiz').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('type').textContent = 'Thank You';
    document.getElementById('description').textContent = 'Your response has been received. \n Survey link https://surveyswap.io/sr/DCK8-14SE-FBXW or https://www.surveycircle.com/PHTM-3KME-94QP-K6G6/';
    document.getElementById('progress-bar').style.width = '100%';

    const breakdown = document.getElementById('breakdown');
    if (breakdown) {
        breakdown.innerHTML = "";
        values.forEach((v, i) => {
            const span = document.createElement("span");
            span.className = "score-chip";
            span.textContent = `Q${i + 1}: ${v}`;
            breakdown.appendChild(span);
        });
    }

    localStorage.setItem('quizSubmitted', 'true');

    fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, answers: values, fingerprint: getDeviceFingerprint(), timestamp: new Date().toISOString() })
    });
});

function getDeviceFingerprint() {
    const data = [
        navigator.userAgent,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.language
    ].join('|');
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
    }
    return 'dev_' + Math.abs(hash).toString(36);
}

async function checkAccess() {
    try {
        const res = await fetch("/api/check", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: getDeviceFingerprint() })
        });
        const result = await res.json();
        if (!result.allowed) {
            document.getElementById('start-screen').style.display = 'none';
            document.getElementById('quiz').style.display = 'none';
            document.getElementById('result').style.display = 'block';
            document.getElementById('type').textContent = 'Already Submitted';
            document.getElementById('description').textContent = 'You already completed this form. Contact me for a redo. \n If you forgot to take the code, go here: https://surveyswap.io/sr/DCK8-14SE-FBXW or https://www.surveycircle.com/PHTM-3KME-94QP-K6G6/';
        }
    } catch (e) {
        console.warn('checkAccess failed:', e);
    }
}

checkAccess();