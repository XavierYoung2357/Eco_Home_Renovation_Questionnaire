const ClimateData = {
    zones: {
        'tropical': {
            name: 'Tropical Climate',
            code: 'A',
            characteristics: {
                meanTempMin: 20,  // °C
                meanTempMax: 32,
                annualPrecipitation: 2000,  // mm
                monthlyMinSunHours: 150,
                monthlyMaxSunHours: 240,
                avgHumidity: 75,  // %
                coolingDegreeDays: 3500,
                heatingDegreeDays: 0
            }
        },
        'desert': {
            name: 'Desert/Arid Climate',
            code: 'B',
            characteristics: {
                meanTempMin: 5,
                meanTempMax: 38,
                annualPrecipitation: 250,
                monthlyMinSunHours: 250,
                monthlyMaxSunHours: 350,
                avgHumidity: 30,
                coolingDegreeDays: 2800,
                heatingDegreeDays: 800
            }
        },
        'temperate': {
            name: 'Temperate Climate',
            code: 'C',
            characteristics: {
                meanTempMin: 0,
                meanTempMax: 25,
                annualPrecipitation: 800,
                monthlyMinSunHours: 50,
                monthlyMaxSunHours: 250,
                avgHumidity: 60,
                coolingDegreeDays: 500,
                heatingDegreeDays: 2500
            }
        },
        'continental': {
            name: 'Continental Climate',
            code: 'D',
            characteristics: {
                meanTempMin: -15,
                meanTempMax: 28,
                annualPrecipitation: 600,
                monthlyMinSunHours: 30,
                monthlyMaxSunHours: 280,
                avgHumidity: 55,
                coolingDegreeDays: 600,
                heatingDegreeDays: 4000
            }
        },
        'polar': {
            name: 'Polar Climate',
            code: 'E',
            characteristics: {
                meanTempMin: -30,
                meanTempMax: 10,
                annualPrecipitation: 400,
                monthlyMinSunHours: 0,
                monthlyMaxSunHours: 300,
                avgHumidity: 70,
                coolingDegreeDays: 0,
                heatingDegreeDays: 8000
            }
        }
    },

    monthlyFactors: [
        { month: 'Jan', tempFactor: 0.3, sunFactor: 0.3, precipFactor: 0.8 },
        { month: 'Feb', tempFactor: 0.35, sunFactor: 0.4, precipFactor: 0.75 },
        { month: 'Mar', tempFactor: 0.45, sunFactor: 0.5, precipFactor: 0.8 },
        { month: 'Apr', tempFactor: 0.6, sunFactor: 0.65, precipFactor: 0.9 },
        { month: 'May', tempFactor: 0.75, sunFactor: 0.8, precipFactor: 0.85 },
        { month: 'Jun', tempFactor: 0.9, sunFactor: 0.95, precipFactor: 0.7 },
        { month: 'Jul', tempFactor: 1.0, sunFactor: 1.0, precipFactor: 0.6 },
        { month: 'Aug', tempFactor: 0.95, sunFactor: 0.9, precipFactor: 0.65 },
        { month: 'Sep', tempFactor: 0.8, sunFactor: 0.75, precipFactor: 0.75 },
        { month: 'Oct', tempFactor: 0.6, sunFactor: 0.55, precipFactor: 0.9 },
        { month: 'Nov', tempFactor: 0.45, sunFactor: 0.35, precipFactor: 0.95 },
        { month: 'Dec', tempFactor: 0.35, sunFactor: 0.25, precipFactor: 0.9 }
    ],


}


// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClimateData;
}