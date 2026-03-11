// Tax and contribution rates for Macedonia (2019 rules)
const RATES = {
    pension: 0.188,           // 18.8% pension contribution
    health: 0.075,            // 7.5% health insurance
    unemployment: 0.012,      // 1.2% unemployment
    additionalHealth: 0.005,  // 0.5% additional health
    incomeTax: 0.10,          // 10% income tax
};

// Salary and tax constants (update these as needed)
const CONSTANTS = {
    averageSalary: 69141,      // Просечна плата
    personalAllowance: 10932,  // Лично ослободување
    minNet: 24445,             // Минимална нето плата
    minGross: 36037,           // Минимална бруто плата
};

// Calculate total contribution rate
const TOTAL_CONTRIBUTION_RATE = 
    RATES.pension + 
    RATES.health + 
    RATES.unemployment + 
    RATES.additionalHealth;

/**
 * Calculate net salary from gross salary
 */
function calculateNetFromGross(grossSalary) {
    const pension = grossSalary * RATES.pension;
    const health = grossSalary * RATES.health;
    const unemployment = grossSalary * RATES.unemployment;
    const additionalHealth = grossSalary * RATES.additionalHealth;
    
    const totalContributions = pension + health + unemployment + additionalHealth;
    
    // Tax base is gross minus contributions, minus personal allowance
    const taxBaseBeforeAllowance = grossSalary - totalContributions;
    const taxBase = Math.max(0, taxBaseBeforeAllowance - CONSTANTS.personalAllowance);
    const incomeTax = taxBase * RATES.incomeTax;
    const netSalary = taxBaseBeforeAllowance - incomeTax;
    
    return {
        grossSalary,
        netSalary,
        pension,
        health,
        unemployment,
        additionalHealth,
        totalContributions,
        taxBase,
        incomeTax,
    };
}

/**
 * Calculate gross salary from net salary
 */
function calculateGrossFromNet(netSalary) {
    // This requires solving the equation with personal allowance
    // We'll use an iterative approach to find the gross salary
    
    let grossEstimate = netSalary * 1.4; // Initial estimate
    let iterations = 0;
    const maxIterations = 20;
    const tolerance = 0.01;
    
    while (iterations < maxIterations) {
        const result = calculateNetFromGross(grossEstimate);
        const difference = result.netSalary - netSalary;
        
        if (Math.abs(difference) < tolerance) {
            return result;
        }
        
        // Adjust estimate based on difference
        grossEstimate -= difference;
        iterations++;
    }
    
    // Fallback: return the closest we got
    return calculateNetFromGross(grossEstimate);
}

/**
 * Parse European formatted number (1.234,56) to JavaScript number
 */
function parseFormattedValue(value) {
    if (!value) return 0;
    // Remove dots (thousand separators) and replace comma with dot
    const normalized = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
}

/**
 * Format number with European style (dot for thousands, comma for decimal)
 */
function formatNumber(value) {
    return value.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Update the UI with calculation results
 */
function updateUI(results, mode) {
    const resultsSection = document.getElementById('results');
    const resultLabel = document.getElementById('result-label');
    const resultValue = document.getElementById('result-value');
    
    // Show results
    resultsSection.style.display = 'block';
    
    // Update main result based on mode
    if (mode === 'net') {
        resultLabel.textContent = 'Бруто плата:';
        resultValue.textContent = formatNumber(results.grossSalary) + ' МКД';
    } else {
        resultLabel.textContent = 'Нето плата:';
        resultValue.textContent = formatNumber(results.netSalary) + ' МКД';
    }
    
    // Update breakdown
    document.getElementById('pension').textContent = formatNumber(results.pension) + ' МКД';
    document.getElementById('health').textContent = formatNumber(results.health) + ' МКД';
    document.getElementById('unemployment').textContent = formatNumber(results.unemployment) + ' МКД';
    document.getElementById('additional-health').textContent = formatNumber(results.additionalHealth) + ' МКД';
    document.getElementById('total-contributions').textContent = formatNumber(results.totalContributions) + ' МКД';
    document.getElementById('personal-allowance').textContent = formatNumber(CONSTANTS.personalAllowance) + ' МКД';
    document.getElementById('tax-base').textContent = formatNumber(results.taxBase) + ' МКД';
    document.getElementById('income-tax').textContent = formatNumber(results.incomeTax) + ' МКД';
}

/**
 * Initialize calculator
 */
document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const salaryInput = document.getElementById('salary-input');
    const inputLabel = document.getElementById('input-label');
    let currentMode = 'net';
    let lastValue = '0,00';
    
    // Toggle between net and gross modes
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            
            // Update label
            if (currentMode === 'net') {
                inputLabel.textContent = 'Нето плата (МКД)';
            } else {
                inputLabel.textContent = 'Бруто плата (МКД)';
            }
            
            // Recalculate if there's a value
            if (salaryInput.value) {
                calculate();
            }
        });
    });
    
    // Handle input formatting
    function handleInput(e) {
        let cursorPosition = e.target.selectionStart || 0;
        const oldValue = lastValue;
        let value = e.target.value;
        
        // Remove all non-digit and non-comma characters
        let cleanValue = value.replace(/[^\d,]/g, '');
        
        // Count how many digits/commas were before cursor (for repositioning)
        const beforeCursor = value.substring(0, cursorPosition);
        const digitBeforeCursor = beforeCursor.replace(/[^\d,]/g, '').length;
        
        // Split by comma to handle integer and decimal parts
        let parts = cleanValue.split(',');
        let integerPart = parts[0] || '0';
        let decimalPart = parts[1] || '';
        
        // Limit decimal to 2 digits
        if (decimalPart.length > 2) {
            decimalPart = decimalPart.substring(0, 2);
        }
        
        // Format integer part with dots for thousands
        let formattedInteger = '';
        if (integerPart === '') {
            formattedInteger = '0';
        } else {
            // Remove leading zeros except if it's just "0"
            integerPart = integerPart.replace(/^0+/, '') || '0';
            
            // Add dots every 3 digits from right to left
            const digits = integerPart.split('').reverse();
            for (let i = 0; i < digits.length; i++) {
                if (i > 0 && i % 3 === 0) {
                    formattedInteger = '.' + formattedInteger;
                }
                formattedInteger = digits[i] + formattedInteger;
            }
        }
        
        // Construct final value with decimals
        let formatted = formattedInteger;
        if (parts.length > 1 || cleanValue.includes(',')) {
            // User is typing decimals
            formatted += ',' + decimalPart;
        } else {
            // Always show ,00 when no comma typed yet
            formatted += ',00';
        }
        
        // Update input value
        e.target.value = formatted;
        lastValue = formatted;
        
        // Calculate new cursor position
        let newCursorPos = 0;
        let digitCount = 0;
        
        // If we're typing in the integer part (before comma), position accordingly
        if (parts.length === 1 && !cleanValue.includes(',')) {
            // User hasn't typed comma yet, keep cursor before the ,00
            for (let i = 0; i < formatted.length; i++) {
                if (formatted[i] === ',') break;
                if (/\d/.test(formatted[i])) {
                    digitCount++;
                }
                if (digitCount >= digitBeforeCursor) {
                    newCursorPos = i + 1;
                    break;
                }
                newCursorPos = i + 1;
            }
        } else {
            // User is typing decimals, position normally
            for (let i = 0; i < formatted.length; i++) {
                if (/[\d,]/.test(formatted[i])) {
                    digitCount++;
                }
                if (digitCount >= digitBeforeCursor) {
                    newCursorPos = i + 1;
                    break;
                }
                newCursorPos = i + 1;
            }
        }
        
        // Set cursor position
        e.target.setSelectionRange(newCursorPos, newCursorPos);
        
        // Calculate results
        calculate();
    }
    
    // Handle blur to ensure proper formatting
    function handleBlur() {
        const numericValue = parseFormattedValue(salaryInput.value);
        const formatted = formatNumber(numericValue);
        salaryInput.value = formatted;
        lastValue = formatted;
        calculate();
    }
    
    // Handle focus - select all text
    function handleFocus() {
        salaryInput.select();
    }
    
    // Handle keyboard events
    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            handleBlur();
        }
    }
    
    // Event listeners
    salaryInput.addEventListener('input', handleInput);
    salaryInput.addEventListener('blur', handleBlur);
    salaryInput.addEventListener('focus', handleFocus);
    salaryInput.addEventListener('keydown', handleKeyDown);
    
    // Initial setup
    salaryInput.value = '0,00';
    lastValue = '0,00';
    
    function calculate() {
        const value = parseFormattedValue(salaryInput.value);
        
        if (!value || value <= 0 || isNaN(value)) {
            document.getElementById('results').style.display = 'none';
            return;
        }
        
        let results;
        if (currentMode === 'net') {
            results = calculateGrossFromNet(value);
        } else {
            results = calculateNetFromGross(value);
        }
        
        updateUI(results, currentMode);
    }
});