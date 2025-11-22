// Form validation rules
const ValidationRules = {
    property: {
        fields: ['propertyType', 'floorArea', 'location'],
        validate: function() {
            const propertyType = document.getElementById('propertyType').value;
            const floorArea = document.getElementById('floorArea').value;
            const location = document.getElementById('location').value;
            
            const errors = [];
            if (!propertyType) errors.push('Please select a property type');
            if (!floorArea || floorArea < 100 || floorArea > 10000) {
                errors.push('Please enter a valid floor area (100-10000 sq ft)');
            }
            if (!location || location.length < 3) errors.push('Please enter a valid location/postcode');
            
            return { isValid: errors.length === 0, errors };
        }
    },
    systems: {
        fields: ['heatingSystem', 'insulation', 'windows'],
        validate: function() {
            const heatingSystem = document.getElementById('heatingSystem').value;
            const insulation = document.getElementById('insulation').value;
            const windows = document.getElementById('windows').value;
            
            const errors = [];
            if (!heatingSystem) errors.push('Please select your current heating system');
            if (!insulation) errors.push('Please select your insulation level');
            if (!windows) errors.push('Please select your window type');
            
            return { isValid: errors.length === 0, errors };
        }
    },
    goals: {
        validate: function() {
            const goals = document.querySelectorAll('input[name="goals"]:checked');
            const errors = [];
            if (goals.length === 0) errors.push('Please select at least one renovation goal');
            
            return { isValid: errors.length === 0, errors };
        }
    },
    features: {
        validate: function() {
            const features = document.querySelectorAll('input[name="features"]:checked');
            const errors = [];
            if (features.length === 0) errors.push('Please select at least one eco-friendly feature');
            
            return { isValid: errors.length === 0, errors };
        }
    },
    budget: {
        fields: ['budgetRange', 'timeline', 'contactName', 'contactEmail'],
        validate: function() {
            const budgetRange = document.getElementById('budgetRange').value;
            const timeline = document.getElementById('timeline').value;
            const contactName = document.getElementById('contactName').value;
            const contactEmail = document.getElementById('contactEmail').value;
            
            const errors = [];
            if (!budgetRange) errors.push('Please select your budget range');
            if (!timeline) errors.push('Please select your preferred timeline');
            if (!contactName || contactName.length < 2) errors.push('Please enter your name');
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!contactEmail || !emailRegex.test(contactEmail)) {
                errors.push('Please enter a valid email address');
            }
            
            return { isValid: errors.length === 0, errors };
        }
    }
};

// Enhanced navigation with validation
function goToSection(sectionId, skipValidation = false) {
    // Get current section
    const currentSection = document.querySelector('.section.active');
    const currentSectionId = currentSection ? currentSection.id : null;
    
    // Validate current section before moving forward (except when going back)
    if (!skipValidation && currentSectionId && !isMovingBack(currentSectionId, sectionId)) {
        const validation = validateSection(currentSectionId);
        if (!validation.isValid) {
            showValidationErrors(validation.errors);
            return;
        }
    }
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(sectionId).classList.add('active');
    updateProgress(sectionId);
    window.scrollTo(0, 0);
}

function isMovingBack(currentId, targetId) {
    const sections = ['welcome', 'property', 'systems', 'goals', 'features', 'budget', 'results'];
    return sections.indexOf(targetId) < sections.indexOf(currentId);
}

function validateSection(sectionId) {
    if (ValidationRules[sectionId]) {
        return ValidationRules[sectionId].validate();
    }
    return { isValid: true, errors: [] };
}

function showValidationErrors(errors) {
    const errorHtml = errors.map(err => `<li>${err}</li>`).join('');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.innerHTML = `
        <div class="validation-error-content">
            <strong>Please correct the following:</strong>
            <ul>${errorHtml}</ul>
            <button onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #f44336;
        padding: 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        max-width: 400px;
    `;
    document.body.appendChild(errorDiv);
}

function updateProgress(sectionId) {
    const sections = ['welcome', 'property', 'systems', 'goals', 'features', 'budget', 'results'];
    const currentIndex = sections.indexOf(sectionId);
    const progress = (currentIndex / (sections.length - 1)) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

// Enhanced quote generation using DataLoader
function generateQuote() {
    try {
        // Ensure data is loaded
        DataLoader.ensureLoaded();
        
        // Validate budget section first
        const validation = validateSection('budget');
        if (!validation.isValid) {
            showValidationErrors(validation.errors);
            return;
        }
        
        // Collect form data
        const propertyType = document.getElementById('propertyType').value;
        const propertyAge = parseInt(document.getElementById('propertyAge').value) || 0;
        const floorArea = parseInt(document.getElementById('floorArea').value) || 1500;
        const energyBill = parseInt(document.getElementById('energyBill').value) || 150;
        const budgetRange = document.getElementById('budgetRange').value;
        
        // Get selected features
        const selectedFeatures = [];
        document.querySelectorAll('input[name="features"]:checked').forEach(checkbox => {
            selectedFeatures.push(checkbox.value);
        });
        
        if (selectedFeatures.length === 0) {
            showValidationErrors(['Please select at least one eco-friendly feature']);
            return;
        }
        
        // Calculate costs and savings for each feature
        let totalCost = 0;
        let totalAnnualSavings = 0;
        let totalGrantEligible = 0;
        const quoteItems = [];
        
        selectedFeatures.forEach(featureId => {
            const feature = DataLoader.getFeature(featureId);
            if (feature) {
                const cost = DataLoader.calculateCost(featureId, propertyType, floorArea);
                const annualSavings = DataLoader.calculateAnnualSavings(featureId, energyBill);
                const payback = DataLoader.calculatePaybackPeriod(featureId, cost, annualSavings);
                const roi = DataLoader.calculateROI(featureId, cost, annualSavings);
                
                totalCost += cost;
                totalAnnualSavings += annualSavings;
                if (feature.grantEligible) totalGrantEligible += cost * 0.3; // Assume 30% grant coverage
                
                quoteItems.push({
                    feature: feature,
                    cost: cost,
                    annualSavings: annualSavings,
                    payback: payback,
                    roi: roi
                });
            }
        });
        
        // Add survey fee
        const surveyFee = Math.round(floorArea * 2);
        totalCost += surveyFee;
        
        // Check budget compatibility
        const maxBudget = DataLoader.parseBudgetRange(budgetRange);
        const overBudget = maxBudget > 0 && totalCost > maxBudget;
        
        // Generate quote HTML
        let quoteHTML = `
            <div class="quote-header">
                <h3>Your Personalized Eco-Renovation Quote</h3>
                <p class="quote-date">Generated: ${new Date().toLocaleDateString()}</p>
            </div>
        `;
        
        if (overBudget) {
            quoteHTML += `
                <div class="budget-warning">
                    <strong>⚠️ Budget Notice:</strong> Total cost exceeds your selected budget range. 
                    Consider phased installation or reviewing selected features.
                </div>
            `;
        }
        
        quoteHTML += '<div class="quote-items">';
        quoteHTML += '<h4>Selected Eco-Friendly Features:</h4>';
        
        // Sort items by priority
        quoteItems.sort((a, b) => a.feature.priority - b.feature.priority);
        
        quoteItems.forEach(item => {
            quoteHTML += `
                <div class="quote-item-detailed">
                    <div class="quote-item-header">
                        <span class="item-name">${item.feature.name}</span>
                        <span class="item-cost">£${item.cost.toLocaleString()}</span>
                    </div>
                    <div class="quote-item-details">
                        <div class="detail-row">
                            <span>Installation: ${item.feature.installationDays}</span>
                            <span>Annual Savings: £${item.annualSavings.toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <span>Payback: ${item.payback === Infinity ? 'N/A' : item.payback + ' years'}</span>
                            <span>ROI: ${item.roi}%</span>
                        </div>
                        ${item.feature.grantEligible ? 
                            '<div class="grant-eligible">✓ Grant Eligible</div>' : ''}
                    </div>
                </div>
            `;
        });
        
        // Add survey fee
        quoteHTML += `
            <div class="quote-item">
                <span>Site Survey & Assessment</span>
                <span>£${surveyFee.toLocaleString()}</span>
            </div>
        `;
        
        quoteHTML += '</div>'; // Close quote-items
        
        // Summary section
        quoteHTML += `
            <div class="quote-summary-section">
                <div class="summary-row total">
                    <span>Total Investment</span>
                    <span>£${totalCost.toLocaleString()}</span>
                </div>
                ${totalGrantEligible > 0 ? `
                <div class="summary-row grants">
                    <span>Potential Grant Funding</span>
                    <span>£${Math.round(totalGrantEligible).toLocaleString()}</span>
                </div>
                <div class="summary-row net-cost">
                    <span>Net Cost After Grants</span>
                    <span>£${Math.round(totalCost - totalGrantEligible).toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="summary-row savings">
                    <span>Estimated Annual Savings</span>
                    <span>£${totalAnnualSavings.toLocaleString()}</span>
                </div>
                <div class="summary-row payback">
                    <span>Average Payback Period</span>
                    <span>${totalAnnualSavings > 0 ? 
                        Math.round(totalCost / totalAnnualSavings * 10) / 10 + ' years' : 'N/A'}</span>
                </div>
                <div class="summary-row carbon">
                    <span>Est. CO₂ Reduction</span>
                    <span>${Math.round(totalAnnualSavings * 0.0023)} tonnes/year</span>
                </div>
            </div>
        `;
        
        // Installation phases suggestion for large projects
        if (quoteItems.length > 3) {
            quoteHTML += generatePhasedInstallationPlan(quoteItems, maxBudget);
        }
        
        // Disclaimers
        quoteHTML += `
            <div class="quote-disclaimers">
                <p><strong>Important Notes:</strong></p>
                <ul>
                    <li>This is an indicative quotation. Final costs will be confirmed after detailed site survey.</li>
                    <li>Grant eligibility subject to current government schemes and requirements.</li>
                    <li>Savings estimates based on current energy prices and typical usage patterns.</li>
                    <li>Installation times may vary based on property specifics and weather conditions.</li>
                </ul>
            </div>
        `;
        
        // Update the quote summary div
        document.getElementById('quoteSummary').innerHTML = quoteHTML;
        
        // Save quote data for later retrieval
        saveQuoteData({
            quoteItems,
            totalCost,
            totalAnnualSavings,
            totalGrantEligible,
            surveyFee,
            propertyType,
            floorArea,
            energyBill
        });
        
        // Navigate to results section
        goToSection('results', true);
        
    } catch (error) {
        console.error('Error generating quote:', error);
        showNotification('Error generating quote. Please try again.', 'error');
    }
}

function generatePhasedInstallationPlan(quoteItems, maxBudget) {
    let html = '<div class="phased-installation">';
    html += '<h4>Suggested Phased Installation Plan:</h4>';
    
    // Group by priority
    const phase1 = quoteItems.filter(item => item.feature.priority <= 2);
    const phase2 = quoteItems.filter(item => item.feature.priority === 3);
    const phase3 = quoteItems.filter(item => item.feature.priority > 3);
    
    if (phase1.length > 0) {
        const phase1Cost = phase1.reduce((sum, item) => sum + item.cost, 0);
        html += `
            <div class="phase">
                <strong>Phase 1 (Priority - Immediate):</strong>
                <ul>${phase1.map(item => `<li>${item.feature.name} - £${item.cost.toLocaleString()}</li>`).join('')}</ul>
                <div class="phase-total">Phase Cost: £${phase1Cost.toLocaleString()}</div>
            </div>
        `;
    }
    
    if (phase2.length > 0) {
        const phase2Cost = phase2.reduce((sum, item) => sum + item.cost, 0);
        html += `
            <div class="phase">
                <strong>Phase 2 (6-12 months):</strong>
                <ul>${phase2.map(item => `<li>${item.feature.name} - £${item.cost.toLocaleString()}</li>`).join('')}</ul>
                <div class="phase-total">Phase Cost: £${phase2Cost.toLocaleString()}</div>
            </div>
        `;
    }
    
    if (phase3.length > 0) {
        const phase3Cost = phase3.reduce((sum, item) => sum + item.cost, 0);
        html += `
            <div class="phase">
                <strong>Phase 3 (12+ months):</strong>
                <ul>${phase3.map(item => `<li>${item.feature.name} - £${item.cost.toLocaleString()}</li>`).join('')}</ul>
                <div class="phase-total">Phase Cost: £${phase3Cost.toLocaleString()}</div>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

function saveQuoteData(quoteData) {
    const quote = {
        id: 'QUOTE-' + Date.now(),
        timestamp: new Date().toISOString(),
        property: {
            type: document.getElementById('propertyType').value,
            age: document.getElementById('propertyAge').value,
            floorArea: document.getElementById('floorArea').value,
            bedrooms: document.getElementById('bedrooms').value,
            location: document.getElementById('location').value
        },
        systems: {
            heating: document.getElementById('heatingSystem').value,
            insulation: document.getElementById('insulation').value,
            windows: document.getElementById('windows').value,
            energyBill: document.getElementById('energyBill').value
        },
        goals: Array.from(document.querySelectorAll('input[name="goals"]:checked'))
            .map(cb => cb.value),
        selectedFeatures: Array.from(document.querySelectorAll('input[name="features"]:checked'))
            .map(cb => cb.value),
        budget: document.getElementById('budgetRange').value,
        timeline: document.getElementById('timeline').value,
        priority: document.querySelector('input[name="priority"]:checked')?.value,
        contact: {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value
        },
        quoteData: quoteData,
        quoteSummary: document.getElementById('quoteSummary').innerHTML
    };
    
    // Store in sessionStorage for current session
    sessionStorage.setItem('currentQuote', JSON.stringify(quote));
    
    return quote;
}

function saveQuote() {
    try {
        const currentQuote = sessionStorage.getItem('currentQuote');
        if (!currentQuote) {
            showNotification('No quote to save. Please generate a quote first.', 'error');
            return;
        }
        
        const quote = JSON.parse(currentQuote);
        const additionalNotes = document.getElementById('additionalNotes').value;
        if (additionalNotes) {
            quote.additionalNotes = additionalNotes;
        }
        
        // Get existing quotes
        const quotes = JSON.parse(localStorage.getItem('ecoHomeQuotes') || '[]');
        
        // Add new quote
        quotes.push(quote);
        
        // Keep only last 10 quotes
        if (quotes.length > 10) {
            quotes.shift();
        }
        
        // Save to localStorage
        localStorage.setItem('ecoHomeQuotes', JSON.stringify(quotes));
        
        showNotification(`Quote ${quote.id} saved successfully! You can retrieve it anytime from this browser.`, 'success');
        
        // Optionally, offer to download as JSON
        offerQuoteDownload(quote);
        
    } catch (error) {
        console.error('Error saving quote:', error);
        showNotification('Error saving quote. Please try again.', 'error');
    }
}

function offerQuoteDownload(quote) {
    if (confirm('Would you like to download a copy of your quote?')) {
        const dataStr = JSON.stringify(quote, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `eco-quote-${quote.id}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

function loadSavedQuotes() {
    try {
        const quotes = JSON.parse(localStorage.getItem('ecoHomeQuotes') || '[]');
        return quotes;
    } catch (error) {
        console.error('Error loading saved quotes:', error);
        return [];
    }
}

function startOver() {
    if (confirm('Are you sure you want to start a new quote? Current data will be lost.')) {
        // Clear all form fields
        document.querySelectorAll('input, select, textarea').forEach(element => {
            if (element.type === 'checkbox' || element.type === 'radio') {
                element.checked = false;
            } else {
                element.value = '';
            }
        });
        
        // Clear session storage
        sessionStorage.removeItem('currentQuote');
        
        // Reset to welcome
        goToSection('welcome', true);
    }
}

function showNotification(message, type = 'info') {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    const bgColor = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1';
    const borderColor = type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb';
    
    notificationDiv.innerHTML = `
        <span class="notification-icon">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    notificationDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        border: 1px solid ${borderColor};
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 9999;
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notificationDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notificationDiv.parentElement) {
            notificationDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notificationDiv.remove(), 300);
        }
    }, 5000);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing Eco-Home Renovation App...');
    
    try {
        // Load all data
        await DataLoader.loadAll();
        
        // Initialize progress bar
        updateProgress('welcome');
        
        // Add animation styles if not already present
        if (!document.getElementById('customAnimations')) {
            const style = document.createElement('style');
            style.id = 'customAnimations';
            style.innerHTML = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .data-loader {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .loader-content {
                    text-align: center;
                }
                .validation-error-content {
                    text-align: left;
                }
                .validation-error-content ul {
                    margin: 10px 0;
                    padding-left: 20px;
                }
                .validation-error-content button {
                    margin-top: 10px;
                    padding: 8px 20px;
                    background: #4caf50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .budget-warning {
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    padding: 15px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                }
                .quote-item-detailed {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                .quote-item-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                .item-cost {
                    color: #2e7d32;
                }
                .quote-item-details {
                    font-size: 0.9em;
                    color: #666;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 5px 0;
                }
                .grant-eligible {
                    color: #4caf50;
                    font-weight: 600;
                    margin-top: 5px;
                }
                .quote-summary-section {
                    background: #e8f5e9;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #c8e6c9;
                }
                .summary-row.total {
                    font-weight: 600;
                    font-size: 1.2em;
                    color: #2e7d32;
                    border-bottom: 2px solid #4caf50;
                }
                .summary-row.savings {
                    color: #2e7d32;
                }
                .summary-row.grants {
                    color: #ff9800;
                }
                .phased-installation {
                    background: #f1f8f4;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .phase {
                    margin-bottom: 15px;
                }
                .phase-total {
                    font-weight: 600;
                    color: #2e7d32;
                    margin-top: 10px;
                }
                .quote-disclaimers {
                    background: #f5f5f5;
                    padding: 15px;
                    border-radius: 6px;
                    margin-top: 20px;
                    font-size: 0.9em;
                }
                .quote-disclaimers ul {
                    margin: 10px 0;
                    padding-left: 20px;
                }
            `;
            document.head.appendChild(style);
        }
        
        console.log('App initialization complete');
        
    } catch (error) {
        console.error('Critical error during initialization:', error);
        showNotification('Error initializing application. Some features may not work correctly.', 'error');
    }
});
