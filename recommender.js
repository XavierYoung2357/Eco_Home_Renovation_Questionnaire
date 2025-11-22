/* ================================
   RECOMMENDER MODULE
   Provides personalized recommendations based on property and user goals
   ================================ */

   const Recommender = {
    recommendations: [],
    selectedRecommendations: new Set(),

    async showRecommendations() {
        const modal = document.getElementById('recommendationModal');
        modal.classList.add('active');

        // Show loading
        document.getElementById('recommendationLoading').style.display = 'block';
        document.getElementById('recommendationContent').style.display = 'none';

        // Simulate analysis delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate recommendations
        this.generateRecommendations();

        // Display them
        this.displayRecommendations();

        // Hide loading, show content
        document.getElementById('recommendationLoading').style.display = 'none';
        document.getElementById('recommendationContent').style.display = 'block';
    },

    generateRecommendations() {
        // Collect user data
        const propertyType = document.getElementById('propertyType').value;
        const propertyAge = parseInt(document.getElementById('propertyAge').value) || 0;
        const floorArea = parseInt(document.getElementById('floorArea').value) || 1500;
        const heatingSystem = document.getElementById('heatingSystem').value;
        const insulation = document.getElementById('insulation').value;
        const windows = document.getElementById('windows').value;
        const energyBill = parseInt(document.getElementById('energyBill').value) || 150;
        
        // Get selected goals
        const goals = Array.from(document.querySelectorAll('input[name="goals"]:checked'))
            .map(cb => cb.value);
        
        // Get budget range
        const budgetRange = document.getElementById('budgetRange').value;
        const maxBudget = this.parseBudgetRange(budgetRange);
        
        // Score and rank all features
        this.recommendations = DataLoader.features.map(feature => {
            const score = this.calculateFeatureScore(feature, {
                propertyType,
                propertyAge,
                floorArea,
                heatingSystem,
                insulation,
                windows,
                energyBill,
                goals,
                maxBudget
            });
            
            return {
                feature,
                score: score.total,
                reasons: score.reasons,
                priority: this.determinePriority(score.total),
                estimatedCost: DataLoader.calculateCost(feature.id, propertyType, floorArea),
                estimatedSavings: DataLoader.calculateAnnualSavings(feature.id, energyBill)
            };
        })
        .filter(rec => rec.score > 0) // Only show relevant recommendations
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .slice(0, 8); // Limit to top 8 recommendations
    },

    calculateFeatureScore(feature, userData) {
        let score = 0;
        const reasons = [];
        
        // Base score from priority (lower priority number = higher score)
        score += (6 - feature.priority) * 10;
        
        // === PROPERTY AGE CONSIDERATIONS ===
        if (userData.propertyAge > 20) {
            if (feature.id === 'insulation' || feature.id === 'windows') {
                score += 30;
                reasons.push('Older properties benefit greatly from improved insulation');
            }
            if (feature.id === 'heatpump' && userData.propertyAge > 40) {
                score += 20;
                reasons.push('Perfect time to upgrade from aging heating systems');
            }
        }
        
        // === HEATING SYSTEM UPGRADES ===
        if (userData.heatingSystem === 'gas-boiler' || userData.heatingSystem === 'oil-boiler') {
            if (feature.id === 'heatpump') {
                score += 40;
                reasons.push('Upgrade from fossil fuel heating to reduce carbon footprint');
            }
            if (feature.category === 'energy-generation') {
                score += 20;
                reasons.push('Renewable energy complements fossil fuel reduction strategy');
            }
        }
        
        // === INSULATION PRIORITY ===
        if (userData.insulation === 'none' || userData.insulation === 'partial') {
            if (feature.id === 'insulation') {
                score += 50;
                reasons.push('Poor insulation is your biggest energy loss - should be priority #1');
            }
            if (feature.id === 'heatpump') {
                score -= 20;
                reasons.push('Note: Improve insulation before installing heat pump for best efficiency');
            }
            if (feature.id === 'ventilation') {
                score -= 10;
                reasons.push('Ventilation systems work best with good insulation');
            }
        }
        
        // === WINDOW UPGRADE NEEDS ===
        if (userData.windows === 'single') {
            if (feature.id === 'windows') {
                score += 35;
                reasons.push('Single glazing causes major heat loss - upgrade recommended');
            }
        } else if (userData.windows === 'double' && userData.propertyAge > 15) {
            if (feature.id === 'windows') {
                score += 15;
                reasons.push('Consider triple glazing for maximum efficiency');
            }
        }
        
        // === HIGH ENERGY BILLS ===
        if (userData.energyBill > 200) {
            if (feature.category === 'energy-generation' || feature.category === 'heating') {
                score += 25;
                reasons.push('High energy bills indicate significant savings potential');
            }
            if (feature.savingsPercentage > 0.20) {
                score += 20;
                reasons.push('High-impact feature for reducing energy costs');
            }
        }
        
        // === GOAL ALIGNMENT ===
        if (userData.goals.includes('energy') && feature.savingsPercentage > 0.15) {
            score += 20;
            reasons.push('Aligns with your goal to reduce energy consumption');
        }
        
        if (userData.goals.includes('carbon') && 
            (feature.category === 'energy-generation' || feature.category === 'heating')) {
            score += 25;
            reasons.push('Helps achieve carbon footprint reduction goal');
        }
        
        if (userData.goals.includes('renewable') && feature.category === 'energy-generation') {
            score += 30;
            reasons.push('Perfect match for renewable energy generation goal');
        }
        
        if (userData.goals.includes('comfort') && 
            (feature.id === 'insulation' || feature.id === 'windows' || feature.id === 'ventilation')) {
            score += 15;
            reasons.push('Improves home comfort and temperature consistency');
        }
        
        if (userData.goals.includes('value') && feature.grantEligible) {
            score += 15;
            reasons.push('Grant eligible - increases property value cost-effectively');
        }
        
        if (userData.goals.includes('health') && feature.id === 'ventilation') {
            score += 25;
            reasons.push('Improves indoor air quality for better health');
        }
        
        // === PROPERTY SIZE CONSIDERATIONS ===
        if (userData.floorArea > 2000) {
            if (feature.id === 'solar' || feature.id === 'smart') {
                score += 15;
                reasons.push('Larger properties benefit more from this upgrade');
            }
            if (feature.id === 'heatpump') {
                score += 10;
                reasons.push('Heat pumps are efficient for larger spaces');
            }
        } else if (userData.floorArea < 1000) {
            if (feature.costPerSqFt === 0) {
                score += 10;
                reasons.push('Fixed-cost upgrade suitable for smaller properties');
            }
        }
        
        // === BUDGET CONSIDERATIONS ===
        const estimatedCost = DataLoader.calculateCost(feature.id, userData.propertyType, userData.floorArea);
        if (userData.maxBudget > 0) {
            if (estimatedCost > userData.maxBudget) {
                score -= 30;
                reasons.push('May exceed your budget - consider phased installation');
            } else if (estimatedCost < userData.maxBudget * 0.3) {
                score += 10;
                reasons.push('Well within budget - excellent value');
            }
        }
        
        // === FEATURE DEPENDENCIES ===
        if (feature.id === 'battery') {
            const hasSolar = document.getElementById('feature-solar')?.checked;
            if (hasSolar) {
                score += 25;
                reasons.push('Excellent complement to solar panels for energy independence');
            } else {
                score -= 20;
                reasons.push('Most beneficial when paired with solar panels');
            }
        }
        
        if (feature.id === 'smart') {
            const otherFeatures = document.querySelectorAll('input[name="features"]:checked').length;
            if (otherFeatures > 2) {
                score += 15;
                reasons.push('Smart controls maximize efficiency of multiple systems');
            }
        }
        
        // === GRANT ELIGIBILITY BONUS ===
        if (feature.grantEligible) {
            score += 10;
            reasons.push('Eligible for government grants - reduced net cost');
        }
        
        return {
            total: Math.max(0, score),
            reasons: reasons
        };
    },

    parseBudgetRange(rangeStr) {
        if (!rangeStr) return 0;
        if (rangeStr === '75000+') return 100000;
        
        const parts = rangeStr.split('-');
        return parseInt(parts[1]) || parseInt(parts[0]) || 0;
    },

    determinePriority(score) {
        if (score >= 80) return 'high';
        if (score >= 50) return 'medium';
        return 'low';
    },

    displayRecommendations() {
        const content = document.getElementById('recommendationContent');
        
        if (this.recommendations.length === 0) {
            content.innerHTML = `
                <p style="text-align: center; color: #666;">
                    Please complete the property details and goals sections to receive personalized recommendations.
                </p>
            `;
            return;
        }
        
        // Calculate totals
        const totalCost = this.recommendations.reduce((sum, rec) => sum + rec.estimatedCost, 0);
        const totalSavings = this.recommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0);
        const avgPayback = totalSavings > 0 ? (totalCost / totalSavings).toFixed(1) : 'N/A';
        
        let html = `
            <div class="recommendation-summary">
                <h3>Your Personalized Recommendations</h3>
                <p>Based on your property profile and goals, we've identified ${this.recommendations.length} suitable eco-friendly upgrades.</p>
                
                <div class="recommendation-stats">
                    <div class="stat-item">
                        <div class="stat-value">${this.recommendations.length}</div>
                        <div class="stat-label">Recommendations</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">£${totalCost.toLocaleString()}</div>
                        <div class="stat-label">Total Investment</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">£${totalSavings.toLocaleString()}</div>
                        <div class="stat-label">Annual Savings</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${avgPayback} yrs</div>
                        <div class="stat-label">Avg Payback</div>
                    </div>
                </div>
            </div>
        `;
        
        // Display each recommendation
        this.recommendations.forEach((rec, index) => {
            const payback = rec.estimatedSavings > 0 ? 
                (rec.estimatedCost / rec.estimatedSavings).toFixed(1) : 'N/A';
            
            html += `
                <div class="recommendation-card" onclick="Recommender.toggleRecommendation('${rec.feature.id}')" 
                     data-feature-id="${rec.feature.id}">
                    <div class="recommendation-card-header">
                        <input type="checkbox" 
                               class="recommendation-checkbox" 
                               id="rec-${rec.feature.id}" 
                               onclick="event.stopPropagation();" 
                               onchange="Recommender.toggleRecommendation('${rec.feature.id}')">
                        <div class="recommendation-title">
                            <h4>
                                ${index + 1}. ${rec.feature.name}
                                <span class="recommendation-badge badge-priority-${rec.priority}">
                                    ${rec.priority.toUpperCase()} PRIORITY
                                </span>
                            </h4>
                            <p style="color: #666; margin-top: 5px;">${rec.feature.description}</p>
                        </div>
                    </div>
                    
                    <div class="recommendation-details">
                        <div class="detail-item">
                            <span class="detail-icon">💰</span>
                            <div class="detail-text">
                                <div class="detail-label">Estimated Cost</div>
                                <div class="detail-value">£${rec.estimatedCost.toLocaleString()}</div>
                            </div>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">📉</span>
                            <div class="detail-text">
                                <div class="detail-label">Annual Savings</div>
                                <div class="detail-value">£${rec.estimatedSavings.toLocaleString()}</div>
                            </div>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">⏱️</span>
                            <div class="detail-text">
                                <div class="detail-label">Payback Period</div>
                                <div class="detail-value">${payback} years</div>
                            </div>
                        </div>
                        <div class="detail-item">
                            <span class="detail-icon">🔧</span>
                            <div class="detail-text">
                                <div class="detail-label">Installation</div>
                                <div class="detail-value">${rec.feature.installationDays}</div>
                            </div>
                        </div>
                        ${rec.feature.grantEligible ? `
                        <div class="detail-item">
                            <span class="detail-icon">✅</span>
                            <div class="detail-text">
                                <div class="detail-label">Grant Eligible</div>
                                <div class="detail-value">Yes</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${rec.reasons.length > 0 ? `
                    <div class="recommendation-reason">
                        <strong>Why we recommend this:</strong><br>
                        ${rec.reasons.map(r => `• ${r}`).join('<br>')}
                    </div>
                    ` : ''}
                </div>
            `;
        });
        
        content.innerHTML = html;
    },

    toggleRecommendation(featureId) {
        const checkbox = document.getElementById(`rec-${featureId}`);
        const card = document.querySelector(`.recommendation-card[data-feature-id="${featureId}"]`);
        
        if (this.selectedRecommendations.has(featureId)) {
            this.selectedRecommendations.delete(featureId);
            if (checkbox) checkbox.checked = false;
            if (card) card.classList.remove('selected');
        } else {
            this.selectedRecommendations.add(featureId);
            if (checkbox) checkbox.checked = true;
            if (card) card.classList.add('selected');
        }
    },

    applyRecommendations() {
        if (this.selectedRecommendations.size === 0) {
            showNotification('Please select at least one recommendation to apply.', 'error');
            return;
        }
        
        // Uncheck all features first
        document.querySelectorAll('input[name="features"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Check selected features
        this.selectedRecommendations.forEach(featureId => {
            const checkbox = document.getElementById(`feature-${featureId}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        
        // Close modal
        this.closeModal();
        
        // Show notification
        showNotification(`Applied ${this.selectedRecommendations.size} recommendations to your selection!`, 'success');
        
        // Clear selections
        this.selectedRecommendations.clear();
    },

    closeModal() {
        const modal = document.getElementById('recommendationModal');
        modal.classList.remove('active');
        this.selectedRecommendations.clear();
    }
};

// Global functions for HTML onclick handlers
function showRecommendations() {
    Recommender.showRecommendations();
}

function closeRecommendationModal() {
    Recommender.closeModal();
}

function applyRecommendations() {
    Recommender.applyRecommendations();
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('recommendationModal');
    if (event.target === modal) {
        closeRecommendationModal();
    }
});

// Add recommendation card styles if not present
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('recommendationStyles')) {
        const style = document.createElement('style');
        style.id = 'recommendationStyles';
        style.innerHTML = `
            .recommendation-summary {
                background: #e8f5e9;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
                border-left: 4px solid #4caf50;
            }
            
            .recommendation-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            
            .stat-item {
                text-align: center;
                padding: 10px;
                background: white;
                border-radius: 6px;
            }
            
            .stat-value {
                font-size: 1.5em;
                font-weight: bold;
                color: #4caf50;
            }
            
            .stat-label {
                font-size: 0.9em;
                color: #666;
            }
            
            .recommendation-card {
                background: white;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 15px;
                transition: all 0.3s;
                cursor: pointer;
            }
            
            .recommendation-card:hover {
                border-color: #4caf50;
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
            }
            
            .recommendation-card.selected {
                border-color: #4caf50;
                background: #f1f8f4;
            }
            
            .recommendation-card-header {
                display: flex;
                align-items: start;
                margin-bottom: 15px;
                gap: 15px;
            }
            
            .recommendation-checkbox {
                margin-top: 5px;
                width: 20px;
                height: 20px;
                cursor: pointer;
                flex-shrink: 0;
            }
            
            .recommendation-title {
                flex: 1;
            }
            
            .recommendation-title h4 {
                color: #2e7d32;
                margin-bottom: 5px;
            }
            
            .recommendation-badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.75em;
                font-weight: 600;
                margin-left: 10px;
            }
            
            .badge-priority-high {
                background: #ff5722;
                color: white;
            }
            
            .badge-priority-medium {
                background: #ff9800;
                color: white;
            }
            
            .badge-priority-low {
                background: #2196f3;
                color: white;
            }
            
            .recommendation-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #e0e0e0;
            }
            
            .detail-item {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .detail-icon {
                font-size: 1.2em;
            }
            
            .detail-text {
                font-size: 0.9em;
            }
            
            .detail-label {
                color: #666;
            }
            
            .detail-value {
                font-weight: 600;
                color: #2e7d32;
            }
            
            .recommendation-reason {
                background: #fff9e6;
                padding: 12px;
                border-radius: 6px;
                margin-top: 15px;
                border-left: 3px solid #ffc107;
                font-size: 0.9em;
                line-height: 1.6;
            }
            
            .recommendation-reason strong {
                color: #f57c00;
            }
        `;
        document.head.appendChild(style);
    }
});