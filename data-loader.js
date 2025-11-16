const DataLoader = {
    features: [],
    propertyMultipliers: {},
    categories: {},
    isLoaded: false,
    loadingError: null,

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV file is empty or invalid');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines

            const values = this.parseCSVLine(line);
            const obj = {};

            headers.forEach((header, index) => {
                let value = values[index]?.trim() || '';
                
                // Type conversion
                if (value === 'true') {
                    value = true;
                } else if (value === 'false') {
                    value = false;
                } else if (value !== '' && !isNaN(value)) {
                    value = parseFloat(value);
                }
                
                obj[header] = value;
            });
            data.push(obj);
        }
        return data;
    },

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current);
        return values;
    },

    async loadAll() {
        try {
            console.log('Starting to load CSV data...');
            
            const [featuresCSV, multipliersCSV, categoriesCSV] = await Promise.all([
                fetch('data/features.csv').then(r => {
                    if (!r.ok) throw new Error(`Failed to load features.csv: ${r.status}`);
                    return r.text();
                }),
                fetch('data/property_types.csv').then(r => {
                    if (!r.ok) throw new Error(`Failed to load property-multipliers.csv: ${r.status}`);
                    return r.text();
                }),
                fetch('data/categories.csv').then(r => {
                    if (!r.ok) throw new Error(`Failed to load categories.csv: ${r.status}`);
                    return r.text();
                })
            ]);

            // Parse features
            this.features = this.parseCSV(featuresCSV);
            console.log(`Loaded ${this.features.length} features`);

            // Parse and structure property multipliers
            const multiplierData = this.parseCSV(multipliersCSV);
            multiplierData.forEach(item => {
                this.propertyMultipliers[item.propertyType] = item.multiplier;
            });
            console.log(`Loaded ${Object.keys(this.propertyMultipliers).length} property multipliers`);

            // Parse and structure categories
            const categoryData = this.parseCSV(categoriesCSV);
            categoryData.forEach(item => {
                this.categories[item.id] = {
                    name: item.name,
                    description: item.description,
                    icon: item.icon || ''
                };
            });
            console.log(`Loaded ${Object.keys(this.categories).length} categories`);

            this.isLoaded = true;
            this.loadingError = null;
            return true;

        } catch (error) {
            console.error('Error loading CSV data:', error);
            this.loadingError = error.message;
            this.loadFallbackData();
            return false;
        }
    },

    loadFallbackData() {
        console.warn('Loading fallback data due to CSV load failure');
        
        this.features = [
            {
                id: 'solar',
                name: 'Solar Panels',
                description: 'Generate clean electricity',
                baseCost: 8000,
                costPerSqFt: 5,
                category: 'energy-generation',
                savingsPercentage: 0.25,
                installationDays: '2-3',
                maintenanceCost: 100,
                lifespanYears: 25,
                grantEligible: true,
                priority: 2
            },
            {
                id: 'heatpump',
                name: 'Air Source Heat Pump',
                description: 'Efficient heating',
                baseCost: 12000,
                costPerSqFt: 8,
                category: 'heating',
                savingsPercentage: 0.30,
                installationDays: '3-5',
                maintenanceCost: 150,
                lifespanYears: 20,
                grantEligible: true,
                priority: 3
            },
            {
                id: 'insulation',
                name: 'Advanced Insulation',
                description: 'Walls, roof, and floors',
                baseCost: 6000,
                costPerSqFt: 4,
                category: 'insulation',
                savingsPercentage: 0.20,
                installationDays: '5-7',
                maintenanceCost: 50,
                lifespanYears: 40,
                grantEligible: true,
                priority: 1
            },
            {
                id: 'windows',
                name: 'Energy-Efficient Windows',
                description: 'Triple glazing',
                baseCost: 7000,
                costPerSqFt: 45,
                category: 'insulation',
                savingsPercentage: 0.15,
                installationDays: '3-5',
                maintenanceCost: 50,
                lifespanYears: 30,
                grantEligible: false,
                priority: 2
            },
            {
                id: 'water',
                name: 'Rainwater Harvesting System',
                description: 'Collect and store rainwater',
                baseCost: 3000,
                costPerSqFt: 0,
                category: 'water',
                savingsPercentage: 0.05,
                installationDays: '2-3',
                maintenanceCost: 75,
                lifespanYears: 20,
                grantEligible: false,
                priority: 4
            },
            {
                id: 'battery',
                name: 'Battery Storage',
                description: 'Store solar energy',
                baseCost: 5000,
                costPerSqFt: 0,
                category: 'energy-storage',
                savingsPercentage: 0.10,
                installationDays: '1-2',
                maintenanceCost: 100,
                lifespanYears: 15,
                grantEligible: true,
                priority: 3
            },
            {
                id: 'ventilation',
                name: 'MVHR System',
                description: 'Heat recovery ventilation',
                baseCost: 4000,
                costPerSqFt: 3,
                category: 'ventilation',
                savingsPercentage: 0.12,
                installationDays: '3-4',
                maintenanceCost: 100,
                lifespanYears: 20,
                grantEligible: false,
                priority: 3
            },
            {
                id: 'smart',
                name: 'Smart Home Energy Management',
                description: 'Intelligent energy control',
                baseCost: 2000,
                costPerSqFt: 0,
                category: 'automation',
                savingsPercentage: 0.08,
                installationDays: '1-2',
                maintenanceCost: 50,
                lifespanYears: 10,
                grantEligible: false,
                priority: 5
            }
        ];

        this.propertyMultipliers = {
            'detached': 1.2,
            'semi-detached': 1.0,
            'terraced': 0.9,
            'apartment': 0.7,
            'bungalow': 1.1
        };

        this.categories = {
            'energy-generation': { name: 'Energy Generation', description: 'Produce renewable energy', icon: '⚡' },
            'heating': { name: 'Heating Systems', description: 'Efficient climate control', icon: '🔥' },
            'insulation': { name: 'Insulation', description: 'Reduce heat loss', icon: '🏠' },
            'water': { name: 'Water Management', description: 'Sustainable water usage', icon: '💧' },
            'energy-storage': { name: 'Energy Storage', description: 'Store renewable energy', icon: '🔋' },
            'ventilation': { name: 'Ventilation', description: 'Fresh air circulation', icon: '🌬️' },
            'automation': { name: 'Smart Automation', description: 'Intelligent controls', icon: '🤖' }
        };

        this.isLoaded = true;
    },

    getFeature(id) {
        return this.features.find(f => f.id === id);
    },

    getFeaturesByCategory(category) {
        return this.features.filter(f => f.category === category);
    },

    getAllCategories() {
        const categoryIds = [...new Set(this.features.map(f => f.category))];
        return categoryIds.map(id => ({
            id: id,
            ...this.categories[id]
        }));
    },

    calculateCost(featureId, propertyType, floorArea) {
        const feature = this.getFeature(featureId);
        if (!feature) {
            console.warn(`Feature ${featureId} not found`);
            return 0;
        }

        const multiplier = this.propertyMultipliers[propertyType] || 1.0;
        const areaCost = (feature.costPerSqFt || 0) * (floorArea || 0);
        const totalCost = (feature.baseCost + areaCost) * multiplier;
        
        return Math.round(totalCost);
    },

    calculateAnnualSavings(featureId, currentEnergyBill) {
        const feature = this.getFeature(featureId);
        if (!feature || !currentEnergyBill) return 0;

        const annualBill = currentEnergyBill * 12;
        const savings = annualBill * (feature.savingsPercentage || 0);
        
        return Math.round(savings);
    },

    calculatePaybackPeriod(featureId, cost, annualSavings) {
        if (!annualSavings || annualSavings === 0) return Infinity;
        const feature = this.getFeature(featureId);
        if (!feature) return Infinity;

        const paybackYears = cost / annualSavings;
        return Math.round(paybackYears * 10) / 10; // Round to 1 decimal
    },

    getRecommendations(propertyType, goals, budget) {
        return this.features
            .filter(f => {
                // Filter based on goals if needed
                return true; // For now, return all
            })
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 5);
    },

    ensureLoaded() {
        if (!this.isLoaded) {
            throw new Error('Data not loaded. Call loadAll() first.');
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}
