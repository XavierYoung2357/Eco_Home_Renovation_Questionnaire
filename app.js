function goToSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    updateProgress(sectionId);
    window.scrollTo(0, 0);
}

function updateProgress(sectionId) {
    const sections = ['welcome', 'property', 'systems', 'goals', 'features', 'budget', 'results'];
    const currentIndex = sections.indexOf(sectionId);
    const progress = (currentIndex / (sections.length - 1)) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

function generateQuote() {
    const features = [];
    document.querySelectorAll('input[name="features"]:checked').forEach(checkbox => {
        features.push(checkbox.value);
    });

    let totalCost = 0;
    const costMap = {
        'solar': 8000,
        'heatpump': 12000,
        'insulation': 6000,
        'windows': 7000,
        'water': 3000,
        'battery': 5000,
        'ventilation': 4000,
        'smart': 2000
    };

    let quoteHTML = '<h3>Selected Features:</h3>';
    features.forEach(feature => {
        const cost = costMap[feature] || 0;
        totalCost += cost;
        const featureName = document.querySelector(`label[for="feature-${feature}"]`).textContent;
        quoteHTML += `<div class="quote-item"><span>${featureName}</span><span>£${cost.toLocaleString()}</span></div>`;
    });

    const floorArea = document.getElementById('floorArea').value || 1500;
    const surveyFee = Math.round(floorArea * 2);
    totalCost += surveyFee;

    quoteHTML += `<div class="quote-item"><span>Site Survey & Assessment</span><span>£${surveyFee.toLocaleString()}</span></div>`;
    quoteHTML += `<div class="quote-item"><span>Total Estimated Cost</span><span>£${totalCost.toLocaleString()}</span></div>`;

    const savings = Math.round(totalCost * 0.15);
    quoteHTML += `<p style="margin-top: 20px; color: #2e7d32;"><strong>Estimated Annual Energy Savings: £${savings.toLocaleString()}</strong></p>`;
    quoteHTML += `<p style="color: #666;">Note: Indicative quotation. Final costs confirmed after detailed site survey.</p>`;

    document.getElementById('quoteSummary').innerHTML = quoteHTML;
    goToSection('results');
}

function saveQuote() {
    const quoteData = {
        propertyType: document.getElementById('propertyType').value,
        floorArea: document.getElementById('floorArea').value,
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('ecoHomeQuote', JSON.stringify(quoteData));
    alert('Quote saved successfully! You can retrieve it anytime from this browser.');
}

function startOver() {
    if (confirm('Confirm starting new quote? Current data will be lost.')) {
        document.querySelectorAll('input, select, textarea').forEach(element => {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false;
            } else {
                element.value = '';
            }
        });
        goToSection('welcome');
    }
}

updateProgress('welcome');
