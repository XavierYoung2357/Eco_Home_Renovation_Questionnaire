let csvImportData = null;

function switchDataTab(tabName){
    document.querySelectorAll('.data-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    event.target.classList.add('active');

    if(tabName === 'export-data'){
        updateDataSummary();
    }
    if(tabName === 'manage-features'){
        loadFeaturesList();
    }
}

function addCustomFeature(){
    try{
        const featureData = {
            id: document.getElementById('customFeatureId').value.trim(),
            name: document.getElementById('customFeatureName').value.trim(),
            description: document.getElementById('customFeatureDescription').value.trim(),
            baseCost: parseFloat(document.getElementById('customBaseCost').value) || 0,
            costPerSqFt: parseFloat(document.getElementById('customCostPerSqFt').value) || 0,
            category: document.getElementById('customCategory').value,
            savingsPercentage: parseFloat(document.getElementById('customSavingsPercentage').value) || 0,
            installationDays: document.getElementById('customInstallationDays').value.trim(),
            maintenanceCost: parseFloat(document.getElementById('customMaintenanceCost').value) || 0,
            lifespanYears: parseInt(document.getElementById('customLifespanYears').value) || 0,
            grantEligible: document.getElementById('customGrantEligible').value === 'true',
            priority: parseInt(document.getElementById('customPriority').value) || 5,
            isCustom: true //Custom feature designator
        };

        if(!featureData.id || !featureData.name){
            alert('Please provide at least Feature ID and Name');
            return;
        }
        if (DataLoader.getFeature(featureData.id)) {
            if (!confirm(`Feature with ID "${featureData.id}" already exists. Overwrite?`)) {
                return;
            }
            DataLoader.features = DataLoader.features.filter(f => f.id !== featureData.id);
        }
        DataLoader.features.push(featureData);
        
        saveCustomFeaturesToStorage();
        
        addFeatureToHTMLForm(featureData);
        
        alert(`Feature "${featureData.name}" added successfully!`);
        clearCustomFeatureForm();
        
        console.log('Custom feature added:', featureData);
        
    } catch (error) {
        console.error('Error adding custom feature:', error);
        alert('Feature Addition error. Please check for correct inputs.');
    }

}

function addFeatureToHTMLForm(feature){
    const featuresSection = document.querySelector('#features .checkbox-group');

    if (document.getElementById(`feature-${feature.id}`)) {
        return;
    }
    const featureHTML = `
        <div class="checkbox-item">
            <input type="checkbox" id="feature-${feature.id}" name="features" value="${feature.id}">
            <label for="feature-${feature.id}">${feature.name} - ${feature.description}</label>
        </div>
    `;
    featuresSection.insertAdjacentHTML('beforeend', featureHTML);
}

function saveCustomFeaturesToStorage() {
    const customFeatures = DataLoader.features.filter(f => f.isCustom);
    localStorage.setItem('customFeatures', JSON.stringify(customFeatures));
}

function loadCustomFeaturesFromStorage() {
    try {
        const saved = localStorage.getItem('customFeatures');
        if (saved) {
            const customFeatures = JSON.parse(saved);
            customFeatures.forEach(feature => {
                // Avoid duplicates
                if (!DataLoader.getFeature(feature.id)) {
                    DataLoader.features.push(feature);
                    addFeatureToHTMLForm(feature);
                }
            });
            console.log(`Loaded ${customFeatures.length} custom features from storage`);
        }
    } catch (error) {
        console.error('Error loading custom features:', error);
    }
}

function clearCustomFeatureForm() {
    document.getElementById('customFeatureId').value = '';
    document.getElementById('customFeatureName').value = '';
    document.getElementById('customFeatureDescription').value = '';
    document.getElementById('customBaseCost').value = '';
    document.getElementById('customCostPerSqFt').value = '';
    document.getElementById('customCategory').value = 'energy-generation';
    document.getElementById('customSavingsPercentage').value = '';
    document.getElementById('customInstallationDays').value = '';
    document.getElementById('customMaintenanceCost').value = '';
    document.getElementById('customLifespanYears').value = '';
    document.getElementById('customGrantEligible').value = 'false';
    document.getElementById('customPriority').value = '';
}

function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvText = e.target.result;
        csvImportData = csvText;
        
        const preview = document.getElementById('csvPreview');
        const previewContent = document.getElementById('csvPreviewContent');
        

        const lines = csvText.split('\n').slice(0, 10);
        previewContent.textContent = lines.join('\n') + '\n...(truncated)';
        preview.style.display = 'block';
    };
    reader.readAsText(file);
}

function importCSVData() {
    if (!csvImportData) {
        alert('Please select a CSV file first');
        return;
    }
    
    try {
        const dataType = document.getElementById('csvDataType').value;
        const parsedData = DataLoader.parseCSV(csvImportData);
        
        if (dataType === 'features') {
            // Validate feature data
            parsedData.forEach(feature => {
                if (!feature.id || !feature.name) {
                    throw new Error('Invalid feature data: missing id or name');
                }
                feature.isCustom = true; // Mark as custom
            });
            
            // Add to DataLoader (avoid duplicates)
            parsedData.forEach(feature => {
                const existing = DataLoader.getFeature(feature.id);
                if (existing) {
                    if (confirm(`Feature "${feature.id}" exists. Overwrite?`)) {
                        DataLoader.features = DataLoader.features.filter(f => f.id !== feature.id);
                        DataLoader.features.push(feature);
                        addFeatureToHTMLForm(feature);
                    }
                } else {
                    DataLoader.features.push(feature);
                    addFeatureToHTMLForm(feature);
                }
            });
            
            saveCustomFeaturesToStorage();
            alert(`Successfully imported ${parsedData.length} features!`);
            
        } else if (dataType === 'property-multipliers') {
            parsedData.forEach(item => {
                DataLoader.propertyMultipliers[item.propertyType] = item.multiplier;
            });
            localStorage.setItem('customMultipliers', JSON.stringify(DataLoader.propertyMultipliers));
            alert(`Successfully imported ${parsedData.length} property multipliers!`);
            
        } else if (dataType === 'categories') {
            parsedData.forEach(item => {
                DataLoader.categories[item.id] = {
                    name: item.name,
                    description: item.description,
                    icon: item.icon || ''
                };
            });
            localStorage.setItem('customCategories', JSON.stringify(DataLoader.categories));
            alert(`Successfully imported ${parsedData.length} categories!`);
        }
        
        clearCSVImport();
        
    } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Error importing CSV: ' + error.message);
    }
}

function clearCSVImport() {
    document.getElementById('csvFileInput').value = '';
    document.getElementById('csvPreview').style.display = 'none';
    csvImportData = null;
}

function exportDataAsCSV() {
    const exportFeatures = document.getElementById('export-features').checked;
    const exportMultipliers = document.getElementById('export-multipliers').checked;
    const exportCategories = document.getElementById('export-categories').checked;
    const customOnly = document.getElementById('export-custom-only').checked;
    
    if (exportFeatures) {
        let features = customOnly ? 
            DataLoader.features.filter(f => f.isCustom) : 
            DataLoader.features;
        
        const csv = convertToCSV(features, [
            'id', 'name', 'description', 'baseCost', 'costPerSqFt', 
            'category', 'savingsPercentage', 'installationDays', 
            'maintenanceCost', 'lifespanYears', 'grantEligible', 'priority'
        ]);
        downloadFile(csv, 'features.csv', 'text/csv');
    }
    
    if (exportMultipliers) {
        const multipliers = Object.entries(DataLoader.propertyMultipliers).map(([key, value]) => ({
            propertyType: key,
            multiplier: value,
            description: ''
        }));
        const csv = convertToCSV(multipliers, ['propertyType', 'multiplier', 'description']);
        downloadFile(csv, 'property-multipliers.csv', 'text/csv');
    }
    
    if (exportCategories) {
        const categories = Object.entries(DataLoader.categories).map(([id, data]) => ({
            id: id,
            name: data.name,
            description: data.description,
            icon: data.icon
        }));
        const csv = convertToCSV(categories, ['id', 'name', 'description', 'icon']);
        downloadFile(csv, 'categories.csv', 'text/csv');
    }
}

function exportDataAsJSON() {
    const customOnly = document.getElementById('export-custom-only').checked;
    
    const data = {
        features: customOnly ? 
            DataLoader.features.filter(f => f.isCustom) : 
            DataLoader.features,
        propertyMultipliers: DataLoader.propertyMultipliers,
        categories: DataLoader.categories,
        exportDate: new Date().toISOString()
    };
    
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'eco-home-data.json', 'application/json');
}

function convertToCSV(data,headers){
    if(!data||data.length === 0)return '';

    const csvRows = [];
    csvRows.push(headers.join(','));
    data.forEach(item => {
        const values = headers.map(header => {
            const value = item[header];

            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value !== undefined && value !== null ? value : '';
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');

}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function updateDataSummary() {
    document.getElementById('totalFeatures').textContent = DataLoader.features.length;
    document.getElementById('customFeatures').textContent = 
        DataLoader.features.filter(f => f.isCustom).length;
    document.getElementById('totalCategories').textContent = 
        Object.keys(DataLoader.categories).length;
}

function loadFeaturesList() {
    const container = document.getElementById('featuresList');
    const filter = document.getElementById('featureFilter').value;
    
    let features = DataLoader.features;
    if (filter !== 'all') {
        features = features.filter(f => f.category === filter);
    }
    
    if (features.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No features found</p>';
        return;
    }
    
    container.innerHTML = features.map(feature => `
        <div class="feature-item" data-id="${feature.id}">
            <div class="feature-item-header">
                <span class="feature-item-title">${feature.name}</span>
                <span class="feature-item-badge ${feature.isCustom ? 'badge-custom' : 'badge-default'}">
                    ${feature.isCustom ? 'Custom' : 'Default'}
                </span>
            </div>
            <div class="feature-item-details">
                <strong>ID:</strong> ${feature.id}<br>
                <strong>Category:</strong> ${feature.category}<br>
                <strong>Base Cost:</strong> £${feature.baseCost?.toLocaleString()}<br>
                <strong>Description:</strong> ${feature.description}
            </div>
            <div class="feature-item-actions">
                <button class="btn-small btn-edit" onclick="editFeature('${feature.id}')">Edit</button>
                ${feature.isCustom ? `<button class="btn-small btn-delete" onclick="deleteFeature('${feature.id}')">Delete</button>` : ''}
            </div>
        </div>
    `).join('');
}


function filterFeaturesList() {
    loadFeaturesList();
}

function editFeature(featureId) {
    const feature = DataLoader.getFeature(featureId);
    if (!feature) return;
    
    switchDataTab('custom-feature');
    document.querySelector('[onclick*="custom-feature"]').classList.add('active');
    
    document.getElementById('customFeatureId').value = feature.id;
    document.getElementById('customFeatureName').value = feature.name;
    document.getElementById('customFeatureDescription').value = feature.description;
    document.getElementById('customBaseCost').value = feature.baseCost;
    document.getElementById('customCostPerSqFt').value = feature.costPerSqFt;
    document.getElementById('customCategory').value = feature.category;
    document.getElementById('customSavingsPercentage').value = feature.savingsPercentage;
    document.getElementById('customInstallationDays').value = feature.installationDays;
    document.getElementById('customMaintenanceCost').value = feature.maintenanceCost;
    document.getElementById('customLifespanYears').value = feature.lifespanYears;
    document.getElementById('customGrantEligible').value = feature.grantEligible.toString();
    document.getElementById('customPriority').value = feature.priority;
}

function deleteFeature(featureId) {
    if (!confirm(`Confirm deletion of feature "${featureId}"?`)) {
        return;
    }
    
    //Dataloader removal
    DataLoader.features = DataLoader.features.filter(f => f.id !== featureId);
    
    //HTML Removal
    const checkbox = document.getElementById(`feature-${featureId}`);
    if (checkbox) {
        checkbox.closest('.checkbox-item').remove();
    }
    
    //LocalStorage
    saveCustomFeaturesToStorage();
    
    //Reload
    loadFeaturesList();
    
    alert('Feature deleted');
}

document.addEventListener('DOMContentLoaded', function() {

    setTimeout(() => {
        loadCustomFeaturesFromStorage();
    }, 500);
});
