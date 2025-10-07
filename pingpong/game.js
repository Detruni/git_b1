const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const GAME_STATE = {
    running: false,
    finished: false,
    winner: null,
    mode: 'cpu',
    targetScore: 5,
    ball: {
        size: 12,
        baseSpeed: 1.6,
        maxSpeed: 5.2,
        growthFactor: 1.07,
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: 0,
        vy: 0
    },
    player: {
        width: 12,
        height: 90,
        x: 30,
        y: canvas.height / 2 - 45,
        direction: 0,
        speedBase: 1.5,
        speedCurrent: 0,
        speedMax: 3.8,
        acceleration: 1.06,
        score: 0
    },
    opponent: {
        width: 12,
        height: 90,
        x: canvas.width - 42,
        y: canvas.height / 2 - 45,
        direction: 0,
        speedBase: 1.5,
        speedCurrent: 0,
        speedMax: 3.8,
        acceleration: 1.05,
        score: 0
    }
};

const QUIZ_BANK = [
    {
        question: 'Quelle commande affiche la liste des commits d\'une branche ?',
        options: ['git log', 'git status', 'git branch'],
        answer: 0,
        explanation: 'git log liste l\'historique des commits et leurs métadonnées.'
    },
    {
        question: 'Quelle instruction enregistre des fichiers précis pour le prochain commit ?',
        options: ['git checkout', 'git add', 'git revert'],
        answer: 1,
        explanation: 'git add place les modifications sélectionnées dans l\'index (staging).'
    },
    {
        question: 'Quel fichier permet de ne pas versionner certains fichiers ?',
        options: ['README.md', '.gitignore', '.gitkeep'],
        answer: 1,
        explanation: '.gitignore contient les motifs de fichiers à exclure du suivi Git.'
    },
    {
        question: 'Quelle commande récupère les nouveautés depuis un dépôt distant ?',
        options: ['git pull', 'git init', 'git commit'],
        answer: 0,
        explanation: 'git pull fusionne votre branche locale avec les nouvelles mises à jour distantes.'
    },
    {
        question: 'Quel est le rôle principal d\'une branche ?',
        options: ['Sauvegarder les identifiants', 'Isoler un lot de commits', 'Supprimer l\'historique'],
        answer: 1,
        explanation: 'Une branche sert à isoler un flux de travail ou une fonctionnalité.'
    },
    {
        question: 'Que fait git clone ?',
        options: ['Crée un nouveau dépôt vide', 'Copie un dépôt distant en local', 'Supprime un dépôt local'],
        answer: 1,
        explanation: 'git clone télécharge l\'historique et crée un dépôt local identique au distant.'
    },
    {
        question: 'Quelle commande change de branche ?',
        options: ['git switch', 'git merge', 'git tag'],
        answer: 0,
        explanation: 'git switch (ou git checkout) permet de basculer d\'une branche à l\'autre.'
    }
];

const quizOverlay = document.getElementById('quizOverlay');
const quizQuestionEl = document.getElementById('quizQuestion');
const quizOptionsEl = document.getElementById('quizOptions');
const quizFeedbackEl = document.getElementById('quizFeedback');
const quizContinueButton = document.getElementById('quizContinue');

const quizState = {
    active: false,
    answered: false,
    current: null
};

const KEY_STATE = {
    playerUp: false,
    playerDown: false,
    opponentUp: false,
    opponentDown: false
};

function updatePlayerDirection() {
    if (KEY_STATE.playerUp === KEY_STATE.playerDown) {
        GAME_STATE.player.direction = 0;
        return;
    }
    GAME_STATE.player.direction = KEY_STATE.playerUp ? -1 : 1;
}

function updateOpponentDirection() {
    if (GAME_STATE.mode !== 'pvp') {
        return;
    }
    if (KEY_STATE.opponentUp === KEY_STATE.opponentDown) {
        GAME_STATE.opponent.direction = 0;
        return;
    }
    GAME_STATE.opponent.direction = KEY_STATE.opponentUp ? -1 : 1;
}

function resetBall(direction = Math.random() > 0.5 ? 1 : -1) {
    const { ball } = GAME_STATE;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    const angle = (Math.random() * 0.7 - 0.35) * Math.PI;
    const variation = 0.85 + Math.random() * 0.3;
    const speed = ball.baseSpeed * variation;
    ball.vx = Math.cos(angle) * speed * direction;
    ball.vy = Math.sin(angle) * speed;
}

function resetMatch() {
    GAME_STATE.player.score = 0;
    GAME_STATE.opponent.score = 0;
    GAME_STATE.finished = false;
    GAME_STATE.winner = null;
    KEY_STATE.playerUp = false;
    KEY_STATE.playerDown = false;
    KEY_STATE.opponentUp = false;
    KEY_STATE.opponentDown = false;
    GAME_STATE.player.direction = 0;
    GAME_STATE.player.speedCurrent = 0;
    GAME_STATE.opponent.direction = 0;
    GAME_STATE.opponent.speedCurrent = 0;
    resetBall();
}

function showQuiz() {
    if (GAME_STATE.mode !== 'cpu' || !QUIZ_BANK.length) {
        return;
    }
    const question = QUIZ_BANK[Math.floor(Math.random() * QUIZ_BANK.length)];
    quizState.current = question;
    quizState.active = true;
    quizState.answered = false;

    quizQuestionEl.textContent = question.question;
    quizOptionsEl.innerHTML = '';
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.index = String(index);
        button.className = 'rounded-xl border border-slate-200 bg-white px-4 py-2 text-left text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/40';
        button.textContent = option;
        quizOptionsEl.appendChild(button);
    });

    quizFeedbackEl.textContent = '';
    quizFeedbackEl.classList.remove('text-green-600', 'text-rose-500');
    quizFeedbackEl.classList.add('text-slate-500');
    quizContinueButton.hidden = true;

    quizOverlay.classList.remove('hidden');
    quizOverlay.classList.add('flex');
    quizOverlay.setAttribute('aria-hidden', 'false');
    KEY_STATE.playerUp = false;
    KEY_STATE.playerDown = false;
    KEY_STATE.opponentUp = false;
    KEY_STATE.opponentDown = false;
    updatePlayerDirection();
    updateOpponentDirection();
    GAME_STATE.player.speedCurrent = 0;
    GAME_STATE.opponent.direction = 0;
    GAME_STATE.opponent.speedCurrent = 0;
}

function hideQuiz() {
    quizOverlay.classList.add('hidden');
    quizOverlay.classList.remove('flex');
    quizOverlay.setAttribute('aria-hidden', 'true');
    quizOptionsEl.innerHTML = '';
    quizFeedbackEl.textContent = '';
    quizFeedbackEl.classList.remove('text-green-600', 'text-rose-500');
    quizFeedbackEl.classList.add('text-slate-500');
    quizContinueButton.hidden = true;
    quizState.active = false;
    quizState.answered = false;
    quizState.current = null;
}

function handleQuizOptionClick(event) {
    if (!quizState.active || quizState.answered) {
        return;
    }
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
        return;
    }
    const selectedIndex = Number(target.dataset.index);
    if (Number.isNaN(selectedIndex) || !quizState.current) {
        return;
    }

    const buttons = Array.from(quizOptionsEl.querySelectorAll('button'));
    buttons.forEach((button) => {
        button.disabled = true;
        button.classList.add('cursor-default', 'opacity-95');
    });

    const isCorrect = selectedIndex === quizState.current.answer;

    buttons.forEach((button) => {
        const optionIndex = Number(button.dataset.index);
        if (optionIndex === quizState.current.answer) {
            button.classList.add('border-green-400', 'bg-green-100', 'text-green-700');
        } else if (optionIndex === selectedIndex) {
            button.classList.add('border-rose-400', 'bg-rose-100', 'text-rose-700');
        }
    });

    const explanation = quizState.current.explanation;
    if (isCorrect) {
        quizFeedbackEl.textContent = `Bonne réponse ! ${explanation}`;
        quizFeedbackEl.classList.remove('text-slate-500', 'text-rose-500');
        quizFeedbackEl.classList.add('text-green-600');
    } else {
        quizFeedbackEl.textContent = `Mauvaise réponse... ${explanation}`;
        quizFeedbackEl.classList.remove('text-slate-500', 'text-green-600');
        quizFeedbackEl.classList.add('text-rose-500');
    }

    quizState.answered = true;
    quizContinueButton.hidden = false;
    quizContinueButton.focus();
}

function clampPaddle(paddle) {
    paddle.y = Math.max(20, Math.min(canvas.height - paddle.height - 20, paddle.y));
}

function applyPaddleMovement(paddle) {
    if (paddle.direction !== 0) {
        if (paddle.speedCurrent === 0) {
            paddle.speedCurrent = paddle.speedBase;
        } else {
            paddle.speedCurrent = Math.min(paddle.speedCurrent * paddle.acceleration, paddle.speedMax);
        }
        paddle.y += paddle.direction * paddle.speedCurrent;
    } else {
        paddle.speedCurrent = 0;
    }
    clampPaddle(paddle);
}

function updatePlayer() {
    applyPaddleMovement(GAME_STATE.player);
}

function updateOpponent() {
    const { opponent, ball, mode } = GAME_STATE;
    if (mode === 'cpu') {
        const paddleCenter = opponent.y + opponent.height / 2;
        const delta = ball.y - paddleCenter;
        const deadZone = 12;

        if (Math.abs(delta) <= deadZone) {
            opponent.direction = 0;
        } else {
            opponent.direction = delta < 0 ? -1 : 1;
        }
    } else {
        updateOpponentDirection();
    }

    applyPaddleMovement(opponent);
}

function updateBall() {
    const { ball, player, opponent } = GAME_STATE;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y - ball.size <= 15 || ball.y + ball.size >= canvas.height - 15) {
        ball.vy *= -1;
        ball.y = Math.max(ball.size + 15, Math.min(canvas.height - ball.size - 15, ball.y));
    }

    if (
        ball.x - ball.size <= player.x + player.width &&
        ball.x - ball.size >= player.x &&
        ball.y >= player.y &&
        ball.y <= player.y + player.height
    ) {
        const collidePoint = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        const angle = collidePoint * (Math.PI / 3);
        const prevSpeed = Math.max(Math.hypot(ball.vx, ball.vy), GAME_STATE.ball.baseSpeed);
        const speed = Math.min(prevSpeed * GAME_STATE.ball.growthFactor, GAME_STATE.ball.maxSpeed);
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
        ball.vx = Math.abs(ball.vx);
    }

    if (
        ball.x + ball.size >= opponent.x &&
        ball.x + ball.size <= opponent.x + opponent.width &&
        ball.y >= opponent.y &&
        ball.y <= opponent.y + opponent.height
    ) {
        const collidePoint = (ball.y - (opponent.y + opponent.height / 2)) / (opponent.height / 2);
        const angle = collidePoint * (Math.PI / 3);
        const prevSpeed = Math.max(Math.hypot(ball.vx, ball.vy), GAME_STATE.ball.baseSpeed);
        const speed = Math.min(prevSpeed * GAME_STATE.ball.growthFactor, GAME_STATE.ball.maxSpeed);
        ball.vx = -Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
        ball.vx = -Math.abs(ball.vx);
    }

    if (ball.x + ball.size < 0) {
        scorePoint('opponent');
    } else if (ball.x - ball.size > canvas.width) {
        scorePoint('player');
    }
}

function scorePoint(winner) {
    GAME_STATE[winner].score += 1;
    GAME_STATE.running = false;
    if (GAME_STATE[winner].score >= GAME_STATE.targetScore) {
        GAME_STATE.finished = true;
        GAME_STATE.winner = winner;
    }
    KEY_STATE.playerUp = false;
    KEY_STATE.playerDown = false;
    KEY_STATE.opponentUp = false;
    KEY_STATE.opponentDown = false;
    updatePlayerDirection();
    updateOpponentDirection();
    GAME_STATE.player.speedCurrent = 0;
    GAME_STATE.opponent.direction = 0;
    GAME_STATE.opponent.speedCurrent = 0;
    resetBall(winner === 'player' ? 1 : -1);
    if (winner === 'player' && GAME_STATE.mode === 'cpu' && !GAME_STATE.finished) {
        showQuiz();
    }
}

function drawBoard() {
    ctx.fillStyle = '#e5ecf4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setLineDash([10, 15]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 20);
    ctx.lineTo(canvas.width / 2, canvas.height - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2563eb';
    ctx.fillRect(GAME_STATE.player.x, GAME_STATE.player.y, GAME_STATE.player.width, GAME_STATE.player.height);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(GAME_STATE.opponent.x, GAME_STATE.opponent.y, GAME_STATE.opponent.width, GAME_STATE.opponent.height);

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(GAME_STATE.ball.x, GAME_STATE.ball.y, GAME_STATE.ball.size, 0, Math.PI * 2);
    ctx.fill();
}

function drawScore() {
    ctx.fillStyle = '#1f2937';
    ctx.font = '36px Manrope, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${GAME_STATE.player.score} — ${GAME_STATE.opponent.score}`, canvas.width / 2, 60);
}

function drawOverlay() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1f2937';
    ctx.font = '32px Manrope, sans-serif';
    ctx.textAlign = 'center';

    if (GAME_STATE.finished) {
        let titleMessage;
        if (GAME_STATE.winner === 'player') {
            titleMessage = GAME_STATE.mode === 'pvp' ? 'Joueur 1 gagne !' : 'Victoire !';
        } else {
            titleMessage = GAME_STATE.mode === 'pvp' ? 'Joueur 2 gagne !' : 'Le bot gagne...';
        }
        ctx.fillText(titleMessage, canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px Manrope, sans-serif';
        ctx.fillText('Cliquez sur Réinitialiser pour relancer une partie.', canvas.width / 2, canvas.height / 2 + 25);
    } else {
        const instruction = 'Cliquez sur Lancer / Reprendre ou appuyez sur Espace.';
        ctx.fillText(instruction, canvas.width / 2, canvas.height / 2);
    }
}

function render() {
    drawBoard();
    drawScore();
    if (!GAME_STATE.running) {
        drawOverlay();
    }
}

function step() {
    if (GAME_STATE.running && !GAME_STATE.finished) {
        updatePlayer();
        updateOpponent();
        updateBall();
    }
    render();
    requestAnimationFrame(step);
}

function toggleGame() {
    if (quizState.active) {
        return;
    }
    if (GAME_STATE.finished) {
        return;
    }
    if (!GAME_STATE.running) {
        GAME_STATE.running = true;
        if (GAME_STATE.ball.vx === 0 && GAME_STATE.ball.vy === 0) {
            resetBall();
        }
    } else {
        GAME_STATE.running = false;
    }
}

function resetGame() {
    hideQuiz();
    resetMatch();
    GAME_STATE.running = false;
}

function setGameMode(mode) {
    const normalizedMode = mode === 'pvp' ? 'pvp' : 'cpu';
    if (normalizedMode === GAME_STATE.mode) {
        return;
    }
    GAME_STATE.mode = normalizedMode;
    resetGame();
}

function handleKeyDown(event) {
    const handledKeys = ['KeyW', 'KeyZ', 'KeyS', 'ArrowUp', 'ArrowDown', 'Space'];
    if (handledKeys.includes(event.code)) {
        event.preventDefault();
    }

    if (quizState.active) {
        return;
    }

    switch (event.code) {
        case 'KeyW':
        case 'KeyZ':
            KEY_STATE.playerUp = true;
            updatePlayerDirection();
            break;
        case 'KeyS':
            KEY_STATE.playerDown = true;
            updatePlayerDirection();
            break;
        case 'ArrowUp':
            KEY_STATE.opponentUp = true;
            updateOpponentDirection();
            break;
        case 'ArrowDown':
            KEY_STATE.opponentDown = true;
            updateOpponentDirection();
            break;
        case 'Space':
            toggleGame();
            break;
        default:
            break;
    }
}

function handleKeyUp(event) {
    const handledKeys = ['KeyW', 'KeyZ', 'KeyS', 'ArrowUp', 'ArrowDown'];
    if (handledKeys.includes(event.code)) {
        event.preventDefault();
    }

    if (quizState.active) {
        return;
    }

    switch (event.code) {
        case 'KeyW':
        case 'KeyZ':
            KEY_STATE.playerUp = false;
            updatePlayerDirection();
            break;
        case 'KeyS':
            KEY_STATE.playerDown = false;
            updatePlayerDirection();
            break;
        case 'ArrowUp':
            KEY_STATE.opponentUp = false;
            updateOpponentDirection();
            break;
        case 'ArrowDown':
            KEY_STATE.opponentDown = false;
            updateOpponentDirection();
            break;
        default:
            break;
    }
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

document.getElementById('startButton').addEventListener('click', toggleGame);
document.getElementById('resetButton').addEventListener('click', () => {
    resetGame();
});

quizOptionsEl.addEventListener('click', handleQuizOptionClick);
quizContinueButton.addEventListener('click', () => {
    hideQuiz();
    if (!GAME_STATE.finished) {
        GAME_STATE.running = true;
    }
});

document.querySelectorAll('input[name="gameMode"]').forEach((input) => {
    input.addEventListener('change', (event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement) {
            setGameMode(target.value);
        }
    });
});

resetGame();
step();
