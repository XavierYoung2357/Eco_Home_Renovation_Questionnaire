const Recommender = {
    recommendations:[],
    selectedRecommendations: new Set(),

    async showRecommendations(){
        const modal = document.getElementById('recommendationModal');
        modal.classList.add('active');

        document.getElementById('recommendationLoading').style.display ='block';
        document.getElementById('recommendationContent').style.display ='none';

        await new Promise(resolve =>setTimeout(resolve,800));

        this.generateRecommendations();

        this.displayRecommendations();

        document.getElementById('recommendationLoading').style.display ='none';
        document.getElementById('recommendationContent').style.display ='block';

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
        .sort((a, b) => b.score - a.score); // Sort by score descending
    },


    calculateFeatureScore(feature, userData) {
        let score = 0;
        const reasons = [];
        

        score += (6 - feature.priority) * 10;
        

        if (userData.propertyAge > 20) {
            if (feature.id === 'insulation' || feature.id === 'windows') {
                score += 30;
                reasons.push('Older properties benefit greatly from improved insulation');
            }
        }
        

        if (userData.heatingSystem === 'gas-boiler' || userData.heatingSystem === 'oil-boiler') {
            if (feature.id === 'heatpump') {
                score += 40;
                reasons.push('Upgrading from fossil fuel heating significantly reduces carbon footprint');
            }
        }
        

        if (userData.insulation === 'none' || userData.insulation === 'partial') {
            if (feature.id === 'insulation') {
                score += 50;
                reasons.push('Poor insulation is your biggest energy loss - should be priority #1');
            }
            if (feature.id === 'heatpump') {
                score -= 20; // Don't recommend heat pump without good insulation
                reasons.push('Note: Insulation should be improved before installing heat pump');
            }
        }
        

        if (userData.windows === 'single') {
            if (feature.id === 'windows') {
                score += 35;
                reasons.push('Single glazing causes major heat loss - upgrade recommended');
            }
        }
        

        if (userData.energyBill > 200) {
            if (feature.category === 'energy-generation' || feature.category === 'heating') {
                score += 25;
                reasons.push('High energy bills indicate significant savings potential');
            }
        }
        
        if (userData.goals.includes('energy') && feature.savingsPercentage > 0.15) {
            score += 20;
            reasons.push('Aligns with your goal to reduce energy consumption');
        }
        
        if (userData.goals.includes('carbon') && 
            (feature.category === 'energy-generation' || feature.category === 'heating')) {
            score += 20;
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
            reasons.push('Grant eligible - can increase property value cost-effectively');
        }
        
        if (userData.floorArea > 2000) {
            if (feature.id === 'solar' || feature.id === 'smart') {
                score += 15;
                reasons.push('Larger properties benefit more from this upgrade');
            }
        }
        
        const estimatedCost = DataLoader.calculateCost(feature.id, userData.propertyType, userData.floorArea);
        if (userData.maxBudget > 0 && estimatedCost > userData.maxBudget) {
            score -= 30;
            reasons.push('May exceed your budget range - consider phased installation');
        }
        

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
            score += 10; // Always somewhat useful
            reasons.push('Smart controls maximize efficiency of all systems');
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
        return parseInt(parts[1]) || 0;
    },


    determinePriority(score) {
        if (score >= 80) return 'high';
        if (score >= 50) return 'medium';
        return 'low';
    },


    displayRecommendations() {
        const content = document.getElementById('recommendationContent');
        
        if (this.recommendations.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: #666;">Please complete the property details and goals sections to receive recommendations.</p>';
            return;
        }
        
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
        
        this.recommendations.forEach((rec, index) => {
            const payback = rec.estimatedSavings > 0 ? 
                (rec.estimatedCost / rec.estimatedSavings).toFixed(1) : 'N/A';
            
            html += `
                <div class="recommendation-card" onclick="toggleRecommendation('${rec.feature.id}')" data-feature-id="${rec.feature.id}">
                    <div class="recommendation-card-header">
                        <input type="checkbox" class="recommendation-checkbox" id="rec-${rec.feature.id}" 
                               onclick="event.stopPropagation();" onchange="toggleRecommendation('${rec.feature.id}')">
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
                            <span class="detail-icon">✓</span>
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
                        ${rec.reasons.join('<br>')}
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
            checkbox.checked = false;
            card.classList.remove('selected');
        } else {
            this.selectedRecommendations.add(featureId);
            checkbox.checked = true;
            card.classList.add('selected');
        }
    },

    /**
     * Apply selected recommendations to the features form
     */
    applyRecommendations() {
        if (this.selectedRecommendations.size === 0) {
            alert('Please select at least one recommendation to apply.');
            return;
        }
        
        // Check all selected features in the main form
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

    /**
     * Close recommendation modal
     */
    closeModal() {
        const modal = document.getElementById('recommendationModal');
        modal.classList.remove('active');
        this.selectedRecommendations.clear();
    }
};

function showRecommendations() {
    Recommender.showRecommendations();
}

function closeRecommendationModal() {
    Recommender.closeModal();
}

function toggleRecommendation(featureId) {
    Recommender.toggleRecommendation(featureId);
}

function applyRecommendations() {
    Recommender.applyRecommendations();
}

document.addEventListener('click', function(event) {
    const modal = document.getElementById('recommendationModal');
    if (event.target === modal) {
        closeRecommendationModal();
    }
});