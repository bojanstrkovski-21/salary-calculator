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
 * Format number to 2 decimal places with thousand separators
 */
function formatCurrency(amount) {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
        resultValue.textContent = formatCurrency(results.grossSalary) + ' МКД';
    } else {
        resultLabel.textContent = 'Нето плата:';
        resultValue.textContent = formatCurrency(results.netSalary) + ' МКД';
    }
    
    // Update breakdown
    document.getElementById('pension').textContent = formatCurrency(results.pension) + ' МКД';
    document.getElementById('health').textContent = formatCurrency(results.health) + ' МКД';
    document.getElementById('unemployment').textContent = formatCurrency(results.unemployment) + ' МКД';
    document.getElementById('additional-health').textContent = formatCurrency(results.additionalHealth) + ' МКД';
    document.getElementById('total-contributions').textContent = formatCurrency(results.totalContributions) + ' МКД';
    document.getElementById('tax-base').textContent = formatCurrency(results.taxBase) + ' МКД';
    document.getElementById('income-tax').textContent = formatCurrency(results.incomeTax) + ' МКД';
}

/**
 * Initialize calculator
 */
document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const salaryInput = document.getElementById('salary-input');
    const inputLabel = document.getElementById('input-label');
    let currentMode = 'net';
    
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
    
    // Calculate on input
    salaryInput.addEventListener('input', calculate);
    
    function calculate() {
        const value = parseFloat(salaryInput.value);
        
        if (!value || value <= 0) {
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