// ROI Calculator Engine
class ROICalculator {
    constructor() {
        // Constants from specification
        this.SQLDBM_ANNUAL_COST = 120000; // $120K annual SqlDBM spend
        this.DEFAULT_FTE_COST = 150000; // $150K loaded cost per FTE
        this.DEFAULT_HOURLY_COST = 75; // $75/hour (150K / 2000 hours)
        this.STAKEHOLDER_HOURLY_COST = 60; // $60/hour for business analysts/PMs
        this.DEFAULT_HOURS_PER_MODEL = 80; // 80 hours per model
        
        // Industry benchmarks
        this.industryMultipliers = {
            'financial-services': 1.2,
            'insurance': 1.15,
            'healthcare': 1.1,
            'technology': 1.0,
            'retail-ecommerce': 0.9,
            'manufacturing': 0.8,
            'telecommunications': 1.0,
            'energy': 1.1,
            'government': 0.7,
            'education': 0.6,
            'media': 0.9,
            'other': 1.0
        };

        // Company size multipliers
        this.companySizeMultipliers = {
            'medium': 1.0,
            'large': 1.1,
            'enterprise': 1.2
        };
    }

    calculate(formData) {
        try {
            const results = {
                inputs: this.processInputs(formData),
                savings: {},
                metrics: {},
                breakdown: {},
                timeline: []
            };

            // Calculate each component of savings
            results.savings.laborEfficiency = this.calculateLaborEfficiencySavings(results.inputs);
            results.savings.reworkReduction = this.calculateReworkReduction(results.inputs);
            results.savings.downstreamProductivity = this.calculateDownstreamProductivityGains(results.inputs);
            results.savings.toolConsolidation = this.calculateToolConsolidationSavings(results.inputs);

            // Calculate total annual value and ROI metrics
            results.metrics = this.calculateROIMetrics(results.savings);
            
            // Generate detailed breakdown
            results.breakdown = this.generateBreakdown(results.savings, results.inputs);
            
            // Generate timeline projection
            results.timeline = this.generateTimeline(results.metrics);

            return results;

        } catch (error) {
            console.error('ROI Calculation Error:', error);
            throw new Error('Failed to calculate ROI. Please check your inputs and try again.');
        }
    }

    processInputs(formData) {
        const inputs = {
            // Convert form data to numbers and apply defaults
            dbSpend: parseInt(formData.dbSpend) || 0,
            transformationSpend: parseInt(formData.transformationSpend) || 0,
            teamSize: parseInt(formData.teamSize) || 1,
            stakeholders: parseInt(formData.stakeholders) || 1,
            dataProducts: parseInt(formData.dataProducts) || 1,
            modelTime: parseInt(formData.modelTime) || 30,
            reworkPercent: parseInt(formData.reworkPercent) || 15,
            revisionPercent: parseInt(formData.revisionPercent) || 20,
            
            // Categorical data
            currentTools: formData.currentTools || 'other',
            industry: formData.industry || 'other',
            companySize: formData.companySize || 'medium',
            region: formData.region || 'americas',
            
            // Boolean flags
            usesCICD: formData.usesCICD || false,
            usesGovernance: formData.usesGovernance || false,
            cloudOnly: formData.cloudOnly || false,
            
            // Contact info
            businessEmail: formData.businessEmail || '',
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            company: formData.company || '',
            jobTitle: formData.jobTitle || ''
        };

        // Apply industry and company size multipliers
        inputs.industryMultiplier = this.industryMultipliers[inputs.industry];
        inputs.companySizeMultiplier = this.companySizeMultipliers[inputs.companySize];
        inputs.overallMultiplier = inputs.industryMultiplier * inputs.companySizeMultiplier;

        return inputs;
    }

    calculateLaborEfficiencySavings(inputs) {
        // Step 1: Labor Efficiency Savings
        // Formula: (Total Architects/Engineers × Avg Loaded Cost per FTE × % Time Saved)
        
        let timeSavedPercent = 0.25; // Default 25% time saved
        
        // Adjust based on current tools and practices
        if (inputs.currentTools === 'sqldbm') {
            timeSavedPercent = 0.10; // Minimal additional savings if already using SqlDBM
        } else if (inputs.currentTools === 'excel' || inputs.currentTools === 'visio') {
            timeSavedPercent = 0.35; // More savings from basic tools
        } else if (inputs.currentTools === 'erwin' || inputs.currentTools === 'powerdesigner') {
            timeSavedPercent = 0.20; // Less savings from advanced tools
        }
        
        // Bonus for CI/CD integration readiness
        if (inputs.usesCICD) {
            timeSavedPercent += 0.05;
        }
        
        // Apply company and industry multipliers
        timeSavedPercent *= inputs.overallMultiplier;
        
        // Cap at reasonable maximum
        timeSavedPercent = Math.min(timeSavedPercent, 0.45);
        
        const annualSavings = inputs.teamSize * this.DEFAULT_FTE_COST * timeSavedPercent;
        
        return {
            annualSavings: Math.round(annualSavings),
            timeSavedPercent: Math.round(timeSavedPercent * 100),
            details: `${inputs.teamSize} engineers × $${this.DEFAULT_FTE_COST.toLocaleString()} × ${Math.round(timeSavedPercent * 100)}% time saved`
        };
    }

    calculateReworkReduction(inputs) {
        // Step 2: Rework Reduction
        // Formula: (Total Models per Year × Avg Hours per Model × Hourly Cost × % Rework Avoided)
        
        let reworkAvoided = Math.max(inputs.reworkPercent, inputs.revisionPercent) / 100;
        
        // SqlDBM typically reduces rework by improving clarity and standardization
        const sqldbmReworkReduction = 0.20; // 20% base reduction
        reworkAvoided = Math.min(reworkAvoided, sqldbmReworkReduction * inputs.overallMultiplier);
        
        // Governance tools provide additional benefit
        if (inputs.usesGovernance) {
            reworkAvoided *= 1.1;
        }
        
        const annualSavings = inputs.dataProducts * this.DEFAULT_HOURS_PER_MODEL * this.DEFAULT_HOURLY_COST * reworkAvoided;
        
        return {
            annualSavings: Math.round(annualSavings),
            reworkAvoided: Math.round(reworkAvoided * 100),
            details: `${inputs.dataProducts} models × ${this.DEFAULT_HOURS_PER_MODEL} hrs × $${this.DEFAULT_HOURLY_COST} × ${Math.round(reworkAvoided * 100)}% rework avoided`
        };
    }

    calculateDownstreamProductivityGains(inputs) {
        // Step 3: Downstream Productivity Gains
        // Formula: (Number of Stakeholders × Hours Saved per Month × Hourly Cost × 12 months)
        
        let hoursSavedPerMonth = 3; // Default 3 hours per stakeholder per month
        
        // Adjust based on team practices
        if (inputs.usesGovernance) {
            hoursSavedPerMonth += 1; // Better documentation and discovery
        }
        
        if (inputs.cloudOnly) {
            hoursSavedPerMonth += 0.5; // Easier access and collaboration
        }
        
        // Apply multipliers
        hoursSavedPerMonth *= inputs.overallMultiplier;
        
        const annualSavings = inputs.stakeholders * hoursSavedPerMonth * this.STAKEHOLDER_HOURLY_COST * 12;
        
        return {
            annualSavings: Math.round(annualSavings),
            hoursSavedPerMonth: Math.round(hoursSavedPerMonth * 10) / 10, // Round to 1 decimal
            details: `${inputs.stakeholders} stakeholders × ${Math.round(hoursSavedPerMonth * 10) / 10} hrs/month × $${this.STAKEHOLDER_HOURLY_COST} × 12 months`
        };
    }

    calculateToolConsolidationSavings(inputs) {
        // Step 4: Tool Consolidation Savings
        // Formula: (Current Modeling Tool Spend + Consulting/Contractor Spend) × % Reduced
        
        let currentToolSpend = 0;
        
        // Estimate current tool costs based on team size and current tools
        switch (inputs.currentTools) {
            case 'sqldbm':
                currentToolSpend = 120000; // Already using SqlDBM at $120K
                break;
            case 'erwin':
                currentToolSpend = inputs.teamSize * 8000; // ~$8K per user
                break;
            case 'powerdesigner':
                currentToolSpend = inputs.teamSize * 6000; // ~$6K per user
                break;
            case 'excel':
            case 'visio':
                currentToolSpend = inputs.teamSize * 500; // Minimal licensing
                break;
            case 'lucidchart':
                currentToolSpend = inputs.teamSize * 1200; // ~$100/month per user
                break;
            default:
                currentToolSpend = inputs.teamSize * 2000; // Generic estimate
        }
        
        // Add estimated consulting/contractor spend (typically 30-50% of tool costs for implementation)
        const consultingSpend = currentToolSpend * 0.4;
        const totalCurrentSpend = currentToolSpend + consultingSpend;
        
        // Reduction percentage varies by current sophistication
        let reductionPercent = 0.60; // Default 60% reduction
        
        if (inputs.currentTools === 'sqldbm') {
            reductionPercent = 0.05; // Minimal savings if already using SqlDBM
        } else if (inputs.currentTools === 'excel' || inputs.currentTools === 'visio') {
            reductionPercent = 0.30; // Less existing spend to consolidate
        }
        
        // Apply multipliers
        reductionPercent *= inputs.overallMultiplier;
        reductionPercent = Math.min(reductionPercent, 0.80); // Cap at 80%
        
        const annualSavings = totalCurrentSpend * reductionPercent;
        
        return {
            annualSavings: Math.round(annualSavings),
            currentToolSpend: Math.round(currentToolSpend),
            consultingSpend: Math.round(consultingSpend),
            reductionPercent: Math.round(reductionPercent * 100),
            details: `$${Math.round(totalCurrentSpend).toLocaleString()} current spend × ${Math.round(reductionPercent * 100)}% reduction`
        };
    }

    calculateROIMetrics(savings) {
        const totalAnnualValue = Object.values(savings).reduce((sum, saving) => sum + saving.annualSavings, 0);
        const netAnnualValue = totalAnnualValue - this.SQLDBM_ANNUAL_COST;
        
        // Payback period in months
        const paybackMonths = totalAnnualValue > 0 ? (this.SQLDBM_ANNUAL_COST / totalAnnualValue) * 12 : 99;
        
        // 3-year ROI calculation
        const threeYearValue = netAnnualValue * 3;
        const threeYearInvestment = this.SQLDBM_ANNUAL_COST * 3;
        const threeYearROI = threeYearInvestment > 0 ? threeYearValue / threeYearInvestment : 0;
        
        return {
            totalAnnualValue: Math.round(totalAnnualValue),
            netAnnualValue: Math.round(netAnnualValue),
            paybackMonths: Math.max(0.1, Math.round(paybackMonths * 10) / 10),
            threeYearROI: Math.round(threeYearROI * 10) / 10,
            threeYearValue: Math.round(threeYearValue),
            breakEvenMonth: Math.ceil(paybackMonths)
        };
    }

    generateBreakdown(savings, inputs) {
        const breakdown = [];
        
        breakdown.push({
            category: 'Labor Efficiency Savings',
            amount: savings.laborEfficiency.annualSavings,
            percentage: 0,
            description: savings.laborEfficiency.details
        });
        
        breakdown.push({
            category: 'Rework Reduction',
            amount: savings.reworkReduction.annualSavings,
            percentage: 0,
            description: savings.reworkReduction.details
        });
        
        breakdown.push({
            category: 'Downstream Productivity Gains',
            amount: savings.downstreamProductivity.annualSavings,
            percentage: 0,
            description: savings.downstreamProductivity.details
        });
        
        breakdown.push({
            category: 'Tool Consolidation Savings',
            amount: savings.toolConsolidation.annualSavings,
            percentage: 0,
            description: savings.toolConsolidation.details
        });
        
        // Calculate percentages
        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
        breakdown.forEach(item => {
            item.percentage = total > 0 ? Math.round((item.amount / total) * 100) : 0;
        });
        
        return breakdown;
    }

    generateTimeline(metrics) {
        const timeline = [];
        const monthlyValue = metrics.totalAnnualValue / 12;
        let cumulativeValue = 0;
        let cumulativeCost = 0;
        const monthlyCost = this.SQLDBM_ANNUAL_COST / 12;
        
        for (let month = 1; month <= 36; month++) {
            cumulativeValue += monthlyValue;
            cumulativeCost += monthlyCost;
            
            timeline.push({
                month: month,
                monthlyValue: Math.round(monthlyValue),
                cumulativeValue: Math.round(cumulativeValue),
                cumulativeCost: Math.round(cumulativeCost),
                netValue: Math.round(cumulativeValue - cumulativeCost),
                roi: cumulativeCost > 0 ? Math.round(((cumulativeValue - cumulativeCost) / cumulativeCost) * 100) / 100 : 0
            });
        }
        
        return timeline;
    }

    generateSummaryText(results) {
        const { metrics, inputs } = results;
        
        let summary = '';
        
        if (metrics.paybackMonths <= 12) {
            summary = `Break-even in ${metrics.paybackMonths} months with ${metrics.threeYearROI}x ROI over 3 years`;
        } else if (metrics.paybackMonths <= 24) {
            summary = `Break-even in ${Math.ceil(metrics.paybackMonths)} months with ${metrics.threeYearROI}x ROI over 3 years`;
        } else {
            summary = `Positive ROI achieved over 3 years with ${metrics.threeYearROI}x return`;
        }
        
        const narrative = `With SqlDBM, your ${inputs.teamSize}-person team breaks even in ${Math.ceil(metrics.paybackMonths)} months and achieves ${metrics.threeYearROI}x ROI over 3 years, while empowering ${inputs.stakeholders} downstream stakeholders with better data model access and understanding.`;
        
        return { summary, narrative };
    }
}

// Export for use in other scripts
window.ROICalculator = ROICalculator;