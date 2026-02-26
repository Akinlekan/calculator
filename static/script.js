let currentExpression = '';
let justCalculated = false;
let history = [];

const resultEl = document.getElementById('result');
const expressionEl = document.getElementById('expression');
const historyList = document.getElementById('history-list');

function updateDisplay(value, isError = false) {
    resultEl.textContent = value;
    resultEl.classList.toggle('error', isError);
}

function updateExpression(value) {
    expressionEl.textContent = value;
}

function appendNumber(num) {
    if (justCalculated) {
        currentExpression = '';
        justCalculated = false;
    }
    // Prevent multiple leading zeros
    if (num === '0' && currentExpression === '0') return;
    currentExpression += num;
    updateDisplay(currentExpression);
    updateExpression('');
}

function appendOperator(op) {
    justCalculated = false;
    const operators = ['+', '-', '×', '÷'];
    const lastChar = currentExpression.slice(-1);

    // Replace last operator if there is one
    if (operators.includes(lastChar)) {
        currentExpression = currentExpression.slice(0, -1) + op;
    } else if (currentExpression === '' && op === '-') {
        // Allow negative numbers
        currentExpression += op;
    } else if (currentExpression !== '') {
        currentExpression += op;
    }

    updateDisplay(currentExpression);
    updateExpression('');
}

function appendDecimal() {
    if (justCalculated) {
        currentExpression = '0';
        justCalculated = false;
    }
    // Find the last number segment
    const parts = currentExpression.split(/[+\-×÷]/);
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes('.')) return;
    if (lastPart === '') {
        currentExpression += '0';
    }
    currentExpression += '.';
    updateDisplay(currentExpression);
}

function clearAll() {
    currentExpression = '';
    justCalculated = false;
    updateDisplay('0');
    updateExpression('');
}

function toggleSign() {
    if (!currentExpression || currentExpression === '0') return;
    if (currentExpression.startsWith('-')) {
        currentExpression = currentExpression.slice(1);
    } else {
        currentExpression = '-' + currentExpression;
    }
    updateDisplay(currentExpression);
}

function percentage() {
    if (!currentExpression) return;
    try {
        const val = parseFloat(currentExpression);
        if (!isNaN(val)) {
            currentExpression = String(val / 100);
            updateDisplay(currentExpression);
        }
    } catch (e) {}
}

async function calculate() {
    if (!currentExpression) return;

    const expr = currentExpression;
    updateExpression(expr + ' =');

    try {
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expression: expr })
        });

        const data = await response.json();

        if (data.result === 'Error') {
            updateDisplay(data.error || 'Error', true);
            updateExpression(expr);
        } else {
            updateDisplay(data.result);
            addToHistory(expr, data.result);
            currentExpression = data.result;
            justCalculated = true;
        }
    } catch (e) {
        updateDisplay('Network Error', true);
    }
}

function addToHistory(expr, result) {
    history.push({ expr, result });
    const li = document.createElement('li');
    li.innerHTML = `<span class="hist-expr">${expr} =</span><span class="hist-result">${result}</span>`;
    li.title = 'Click to reuse result';
    li.addEventListener('click', () => {
        currentExpression = result;
        justCalculated = false;
        updateDisplay(result);
        updateExpression('');
    });
    historyList.appendChild(li);
}

function clearHistory() {
    history = [];
    historyList.innerHTML = '';
}

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') appendNumber(e.key);
    else if (e.key === '+') appendOperator('+');
    else if (e.key === '-') appendOperator('-');
    else if (e.key === '*') appendOperator('×');
    else if (e.key === '/') { e.preventDefault(); appendOperator('÷'); }
    else if (e.key === '.') appendDecimal();
    else if (e.key === 'Enter' || e.key === '=') calculate();
    else if (e.key === 'Escape') clearAll();
    else if (e.key === 'Backspace') {
        currentExpression = currentExpression.slice(0, -1);
        updateDisplay(currentExpression || '0');
    }
    else if (e.key === '%') percentage();
});
