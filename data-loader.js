// data-loader.js
const DataLoader = {
    features: [],
    propertyMultipliers: {},
    categories: {},
    isLoaded: false,

    // Parse CSV text to array of objects
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV file is empty or invalid');
        }
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const obj = {};
            headers.forEach((header, index) => {
                let value = values[index]?.trim();
                
                // Type conversion
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value) && value !== '') value = parseFloat(value);
                
                obj[header.trim()] = value;
            });
            data.push(obj);
        }
        return data;
    },

    // Load all CSV files
    async loadAll() {
        try {
            const [featuresCSV, multipliersCSV, categoriesCSV] = await Promise.all([
                fetch('data/features.csv').then(r => r.text()),
                fetch('data/property-multipliers.csv').then(r => r.text()),
                fetch('data/categories.csv').then(r => r.text())
            ]);

            this.features = this.parseCSV(featuresCSV);
            
            const multiplierData = this.parseCSV(multipliersCSV);
            multiplierData.forEach(item => {
                this.propertyMultipliers[item.propertyType] = item.multiplier;
            });

            const categoryData = this.parseCSV(categoriesCSV);
            categoryData.forEach(item => {
                this.categories[item.id] = item;
            });

            this.isLoaded = true;
            console.log('Data loaded successfully:', this.features.length, 'features');
            return true;
        } catch (error) {
            console.error('Error loading CSV data:', error);
            this.loadFallbackData();
            return false;
        }
    },

    // Fallback data if CSV loading fails
    loadFallbackData() {
        console.log('Using fallback data...');
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
            // Add more fallback features...
        ];

        this.propertyMultipliers = {
            'detached': 1.2,
            'semi-detached': 1.0,
            'terraced': 0.9,
            'apartment': 0.7,
            'bungalow': 1.1
        };

        this.isLoaded = true;
    },

    // Get feature by ID
    getFeature(id) {
        return this.features.find(f => f.id === id);
    },

    // Get features by category
    getFeaturesByCategory(category) {
        return this.features.filter(f => f.category === category);
    },

    // Calculate cost for a feature
    calculateCost(featureId, propertyType, floorArea) {
        const feature = this.getFeature(featureId);
        if (!feature) return 0;

        const multiplier = this.propertyMultipliers[propertyType] || 1.0;
        const areaCost = feature.costPerSqFt * (floorArea || 0);
        
        return Math.round((feature.baseCost + areaCost) * multiplier);
    }
};
