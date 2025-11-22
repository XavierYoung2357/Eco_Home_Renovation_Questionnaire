/* ================================
   DATA MANAGER MODULE
   Handles custom features, CSV import/export, and data persistence
   ================================ */

   let csvImportData = null;

   // === TAB MANAGEMENT ===
   function switchDataTab(tabName) {
       // Hide all tabs
       document.querySelectorAll('.data-tab-content').forEach(tab => {
           tab.classList.remove('active');
       });
       
       // Remove active from all buttons
       document.querySelectorAll('.tab-btn').forEach(btn => {
           btn.classList.remove('active');
       });
       
       // Show selected tab
       document.getElementById(`${tabName}-tab`).classList.add('active');
       
       // Set active button
       if (event && event.target) {
           event.target.classList.add('active');
       }
       
       // Run tab-specific initialization
       if (tabName === 'export-data') {
           updateDataSummary();
       }
       if (tabName === 'manage-features') {
           loadFeaturesList();
       }
   }
   
   // === CUSTOM FEATURE MANAGEMENT ===
   function addCustomFeature() {
       try {
           const featureData = {
               id: document.getElementById('customFeatureId').value.trim(),
               name: document.getElementById('customFeatureName').value.trim(),
               description: document.getElementById('customFeatureDescription').value.trim(),
               baseCost: parseFloat(document.getElementById('customBaseCost').value) || 0,
               costPerSqFt: parseFloat(document.getElementById('customCostPerSqFt').value) || 0,
               category: document.getElementById('customCategory').value,
               savingsPercentage: parseFloat(document.getElementById('customSavingsPercentage').value) || 0,
               installationDays: document.getElementById('customInstallationDays').value.trim() || '1-2 days',
               maintenanceCost: parseFloat(document.getElementById('customMaintenanceCost').value) || 0,
               lifespanYears: parseInt(document.getElementById('customLifespanYears').value) || 10,
               grantEligible: document.getElementById('customGrantEligible').value === 'true',
               priority: parseInt(document.getElementById('customPriority').value) || 5,
               isCustom: true
           };
           
           // Validation
           if (!featureData.id || !featureData.name) {
               showNotification('Please provide at least Feature ID and Name', 'error');
               return;
           }
           
           // Check for duplicate ID
           if (DataLoader.getFeature(featureData.id)) {
               if (!confirm(`Feature with ID "${featureData.id}" already exists. Overwrite?`)) {
                   return;
               }
               // Remove existing feature
               DataLoader.features = DataLoader.features.filter(f => f.id !== featureData.id);
           }
           
           // Add to DataLoader
           DataLoader.features.push(featureData);
           
           // Save to localStorage
           saveCustomFeaturesToStorage();
           
           // Add to HTML form
           addFeatureToHTMLForm(featureData);
           
           showNotification(`Feature "${featureData.name}" added successfully!`, 'success');
           clearCustomFeatureForm();
           
           console.log('Custom feature added:', featureData);
           
       } catch (error) {
           console.error('Error adding custom feature:', error);
           showNotification('Error adding feature. Please check your inputs.', 'error');
       }
   }
   
   function addFeatureToHTMLForm(feature) {
       const featuresSection = document.querySelector('#features .checkbox-group');
       if (!featuresSection) return;
       
       // Check if feature already exists
       if (document.getElementById(`feature-${feature.id}`)) {
           // Update existing feature label
           const label = document.querySelector(`label[for="feature-${feature.id}"]`);
           if (label) {
               label.textContent = `${feature.name} - ${feature.description} (£${feature.baseCost.toLocaleString()} base)`;
           }
           return;
       }
       
       // Add new feature
       const featureHTML = `
           <div class="checkbox-item">
               <input type="checkbox" id="feature-${feature.id}" name="features" value="${feature.id}">
               <label for="feature-${feature.id}">${feature.name} - ${feature.description} (£${feature.baseCost.toLocaleString()} base)</label>
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
                   // Check for duplicates
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
   
   // === CSV IMPORT/EXPORT ===
   function handleCSVUpload(event) {
       const file = event.target.files[0];
       if (!file) return;
       
       const reader = new FileReader();
       reader.onload = function(e) {
           const csvText = e.target.result;
           csvImportData = csvText;
           
           // Show preview
           const preview = document.getElementById('csvPreview');
           const previewContent = document.getElementById('csvPreviewContent');
           
           // Show first 10 lines
           const lines = csvText.split('\n').slice(0, 10);
           let previewText = lines.join('\n');
           if (csvText.split('\n').length > 10) {
               previewText += '\n...(showing first 10 lines)';
           }
           
           previewContent.textContent = previewText;
           preview.style.display = 'block';
       };
       reader.readAsText(file);
   }
   
   function importCSVData() {
       if (!csvImportData) {
           showNotification('Please select a CSV file first', 'error');
           return;
       }
       
       try {
           const dataType = document.getElementById('csvDataType').value;
           const parsedData = DataLoader.parseCSV(csvImportData);
           
           if (dataType === 'features') {
               // Validate feature data
               let importCount = 0;
               parsedData.forEach(feature => {
                   if (!feature.id || !feature.name) {
                       console.warn('Skipping invalid feature:', feature);
                       return;
                   }
                   
                   feature.isCustom = true;
                   
                   // Check for existing feature
                   const existing = DataLoader.getFeature(feature.id);
                   if (existing) {
                       if (confirm(`Feature "${feature.id}" exists. Overwrite?`)) {
                           DataLoader.features = DataLoader.features.filter(f => f.id !== feature.id);
                           DataLoader.features.push(feature);
                           addFeatureToHTMLForm(feature);
                           importCount++;
                       }
                   } else {
                       DataLoader.features.push(feature);
                       addFeatureToHTMLForm(feature);
                       importCount++;
                   }
               });
               
               saveCustomFeaturesToStorage();
               showNotification(`Successfully imported ${importCount} features!`, 'success');
               
           } else if (dataType === 'property-multipliers') {
               parsedData.forEach(item => {
                   if (item.propertyType && item.multiplier) {
                       DataLoader.propertyMultipliers[item.propertyType] = parseFloat(item.multiplier) || 1.0;
                   }
               });
               localStorage.setItem('customMultipliers', JSON.stringify(DataLoader.propertyMultipliers));
               showNotification(`Successfully imported ${parsedData.length} property multipliers!`, 'success');
               
           } else if (dataType === 'categories') {
               parsedData.forEach(item => {
                   if (item.id && item.name) {
                       DataLoader.categories[item.id] = {
                           name: item.name,
                           description: item.description || '',
                           icon: item.icon || ''
                       };
                   }
               });
               localStorage.setItem('customCategories', JSON.stringify(DataLoader.categories));
               showNotification(`Successfully imported ${parsedData.length} categories!`, 'success');
           }
           
           clearCSVImport();
           
       } catch (error) {
           console.error('Error importing CSV:', error);
           showNotification('Error importing CSV: ' + error.message, 'error');
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
       
       if (!exportFeatures && !exportMultipliers && !exportCategories) {
           showNotification('Please select at least one data type to export', 'error');
           return;
       }
       
       if (exportFeatures) {
           let features = customOnly ? 
               DataLoader.features.filter(f => f.isCustom) : 
               DataLoader.features;
           
           if (features.length === 0) {
               showNotification('No features to export', 'error');
               return;
           }
           
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
           exportDate: new Date().toISOString(),
           version: '1.0'
       };
       
       const json = JSON.stringify(data, null, 2);
       downloadFile(json, 'eco-home-data.json', 'application/json');
   }
   
   function convertToCSV(data, headers) {
       if (!data || data.length === 0) return '';
       
       const csvRows = [];
       
       // Add headers
       csvRows.push(headers.join(','));
       
       // Add data rows
       data.forEach(item => {
           const values = headers.map(header => {
               const value = item[header];
               
               // Handle different value types
               if (value === undefined || value === null) {
                   return '';
               }
               if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                   // Escape quotes and wrap in quotes
                   return `"${value.replace(/"/g, '""')}"`;
               }
               return value;
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
   
   // === FEATURE MANAGEMENT ===
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
       
       // Sort features by priority, then by name
       features.sort((a, b) => {
           if (a.priority !== b.priority) {
               return a.priority - b.priority;
           }
           return a.name.localeCompare(b.name);
       });
       
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
                   <strong>Cost per Sq Ft:</strong> £${feature.costPerSqFt || 0}<br>
                   <strong>Savings:</strong> ${(feature.savingsPercentage * 100).toFixed(0)}%<br>
                   <strong>Priority:</strong> ${feature.priority}<br>
                   <strong>Grant Eligible:</strong> ${feature.grantEligible ? 'Yes' : 'No'}<br>
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
       
       // Switch to custom feature tab
       switchDataTab('custom-feature');
       
       // Find and activate the correct tab button
       document.querySelectorAll('.tab-btn').forEach(btn => {
           btn.classList.remove('active');
           if (btn.textContent.includes('Add Custom Feature')) {
               btn.classList.add('active');
           }
       });
       
       // Populate form with feature data
       document.getElementById('customFeatureId').value = feature.id;
       document.getElementById('customFeatureName').value = feature.name;
       document.getElementById('customFeatureDescription').value = feature.description;
       document.getElementById('customBaseCost').value = feature.baseCost;
       document.getElementById('customCostPerSqFt').value = feature.costPerSqFt || 0;
       document.getElementById('customCategory').value = feature.category;
       document.getElementById('customSavingsPercentage').value = feature.savingsPercentage;
       document.getElementById('customInstallationDays').value = feature.installationDays;
       document.getElementById('customMaintenanceCost').value = feature.maintenanceCost;
       document.getElementById('customLifespanYears').value = feature.lifespanYears;
       document.getElementById('customGrantEligible').value = feature.grantEligible.toString();
       document.getElementById('customPriority').value = feature.priority;
       
       // Scroll to top of form
       document.getElementById('custom-feature-tab').scrollIntoView({ behavior: 'smooth' });
   }
   
   function deleteFeature(featureId) {
       const feature = DataLoader.getFeature(featureId);
       if (!feature) return;
       
       if (!confirm(`Are you sure you want to delete the feature "${feature.name}"?`)) {
           return;
       }
       
       // Remove from DataLoader
       DataLoader.features = DataLoader.features.filter(f => f.id !== featureId);
       
       // Remove from HTML form
       const checkbox = document.getElementById(`feature-${featureId}`);
       if (checkbox) {
           checkbox.closest('.checkbox-item').remove();
       }
       
       // Update localStorage
       saveCustomFeaturesToStorage();
       
       // Reload list
       loadFeaturesList();
       
       showNotification(`Feature "${feature.name}" deleted successfully`, 'success');
   }
   
   // === INITIALIZATION ===
   document.addEventListener('DOMContentLoaded', function() {
       // Load custom features after DataLoader is ready
       setTimeout(() => {
           loadCustomFeaturesFromStorage();
           
           // Load custom multipliers if any
           const customMultipliers = localStorage.getItem('customMultipliers');
           if (customMultipliers) {
               try {
                   Object.assign(DataLoader.propertyMultipliers, JSON.parse(customMultipliers));
               } catch (e) {
                   console.error('Error loading custom multipliers:', e);
               }
           }
           
           // Load custom categories if any
           const customCategories = localStorage.getItem('customCategories');
           if (customCategories) {
               try {
                   Object.assign(DataLoader.categories, JSON.parse(customCategories));
               } catch (e) {
                   console.error('Error loading custom categories:', e);
               }
           }
       }, 500);
   });