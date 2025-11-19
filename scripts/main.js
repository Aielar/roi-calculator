// Main application logic
class ROICalculatorApp {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.validator = null;
        this.calculator = null;
        this.charts = null;
        this.pdfGenerator = null;
        this.results = null;
        this.formData = {};
        
        this.init();
    }

    init() {
        // Initialize components
        this.validator = new FormValidator();
        this.calculator = new ROICalculator();
        this.charts = new ROICharts();
        this.pdfGenerator = new PDFGenerator();
        this.originalFormData = {}; // Store original inputs
        this.isRecalculation = false; // Track if this is a recalculation

        // Set up event listeners
        this.setupEventListeners();
        this.setupSliders();
        this.setupRealTimeValidation();
        
        // Initialize progress
        this.updateProgress();
        
        console.log('ROI Calculator App initialized');
    }

    setupEventListeners() {
        // Navigation buttons
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const submitBtn = document.getElementById('submitBtn');
        const downloadBtn = document.getElementById('downloadPDF');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevStep());
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadPDF());
        }

                // Setup modification panel sliders
        this.setupModificationSliders();
        const recalculateBtn = document.getElementById('recalculateBtn');
        const resetInputsBtn = document.getElementById('resetInputsBtn');

        if (recalculateBtn) {
            recalculateBtn.addEventListener('click', () => this.recalculateROI());
        }

        if (resetInputsBtn) {
            resetInputsBtn.addEventListener('click', () => this.resetToOriginalInputs());
        }

        // Toggle modification panel
        const toggleModificationPanel = document.getElementById('toggleModificationPanel');
        if (toggleModificationPanel) {
            toggleModificationPanel.addEventListener('click', () => this.toggleModificationPanel());
        }

        // Form submission
        const form = document.getElementById('roiForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });
        }

        // Input change tracking
        this.setupInputTracking();
    }

    setupInputTracking() {
        const form = document.getElementById('roiForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateFormData();
            });
        });

        // Setup transformation tool visibility
        this.setupTransformationToolVisibility();
    }

    setupTransformationToolVisibility() {
        const transformationSpend = document.getElementById('transformationSpend');
        const transformationToolGroup = document.getElementById('transformationToolGroup');
        
        if (transformationSpend && transformationToolGroup) {
            const toggleVisibility = () => {
                if (transformationSpend.value === '0') {
                    transformationToolGroup.style.display = 'none';
                    // Clear the tool name if hiding
                    const transformationTool = document.getElementById('transformationTool');
                    if (transformationTool) {
                        transformationTool.value = '';
                    }
                } else {
                    transformationToolGroup.style.display = 'block';
                }
            };

            // Set initial state
            toggleVisibility();
            
            // Listen for changes
            transformationSpend.addEventListener('change', toggleVisibility);
        }
    }

    setupSliders() {
        // Rework percentage slider
        const reworkSlider = document.getElementById('reworkPercent');
        const reworkValue = document.getElementById('reworkValue');
        
        if (reworkSlider && reworkValue) {
            reworkSlider.addEventListener('input', (e) => {
                reworkValue.textContent = e.target.value + '%';
            });
        }

        // Revision percentage slider
        const revisionSlider = document.getElementById('revisionPercent');
        const revisionValue = document.getElementById('revisionValue');
        
        if (revisionSlider && revisionValue) {
            revisionSlider.addEventListener('input', (e) => {
                revisionValue.textContent = e.target.value + '%';
            });
        }
    }

    setupRealTimeValidation() {
        this.validator = setupRealTimeValidation();
    }

    updateFormData() {
        const form = document.getElementById('roiForm');
        if (!form) return;

        const formData = new FormData(form);
        this.formData = {};

        for (let [key, value] of formData.entries()) {
            this.formData[key] = value;
        }

        // Add checkbox values
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            this.formData[checkbox.name] = checkbox.checked;
        });
    }

    nextStep() {
        // Validate current step
        const validation = this.validator.validateStep(this.currentStep);
        
        if (!validation.valid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        if (this.currentStep < this.totalSteps) {
            this.hideStep(this.currentStep);
            this.currentStep++;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigation();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.hideStep(this.currentStep);
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateNavigation();
        }
    }

    showStep(stepNumber) {
        const step = document.getElementById(`step${stepNumber}`);
        if (step) {
            step.classList.add('active');
            // Scroll to top of form
            step.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    hideStep(stepNumber) {
        const step = document.getElementById(`step${stepNumber}`);
        if (step) {
            step.classList.remove('active');
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            const percentage = (this.currentStep / this.totalSteps) * 100;
            progressFill.style.width = percentage + '%';
        }

        if (progressText) {
            progressText.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
        }
    }

    updateNavigation() {
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const submitBtn = document.getElementById('submitBtn');

        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'inline-block' : 'none';
        }

        if (this.currentStep === this.totalSteps) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'inline-block';
        } else {
            if (nextBtn) nextBtn.style.display = 'inline-block';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }

    showValidationErrors(errors) {
        // Could implement a toast or modal here
        console.log('Validation errors:', errors);
        
        // For now, just focus on the first invalid field
        const firstErrorField = document.querySelector('.form-group.error input, .form-group.error select');
        if (firstErrorField) {
            firstErrorField.focus();
        }
    }

    async submitForm() {
        try {
            // Validate all steps
            const fullValidation = this.validator.validateAllSteps();
            
            if (!fullValidation.valid) {
                this.showValidationErrors(fullValidation.errors);
                return;
            }

            // Update form data
            this.updateFormData();

            // Show loading overlay
            this.showLoading();

            // Calculate ROI (simulate delay for better UX)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.results = this.calculator.calculate(this.formData);
            
            // Send webhook with lead data and results (don't let this block the user experience)
            this.sendWebhookData().catch(error => {
                console.warn('Webhook failed but continuing with user flow:', error);
            });
            
            // Hide loading and show results
            this.hideLoading();
            this.showResults();

        } catch (error) {
            console.error('Form submission error:', error);
            this.hideLoading();
            this.showError('An error occurred while calculating your ROI. Please try again.');
        }
    }

    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    showResults() {
        // Hide form
        const form = document.getElementById('roiForm');
        const navigation = document.querySelector('.form-navigation');
        if (form) form.style.display = 'none';
        if (navigation) navigation.style.display = 'none';

        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Update progress to 100%
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill) progressFill.style.width = '100%';
        if (progressText) progressText.textContent = 'Analysis Complete';

        // Populate results
        this.populateResults();
        
        // Initialize charts
        this.charts.initializeCharts(this.results);
        
        // Setup CTA
        this.setupCTA();
        
        // Populate modification panel (but keep it hidden)
        this.populateModificationPanel();
        
        // Animate numbers
        setTimeout(() => {
            this.charts.animateNumbers(this.results);
        }, 500);
    }

    populateResults() {
        if (!this.results) return;

        const summaryTexts = this.calculator.generateSummaryText(this.results);

        // Update summary metrics
        document.getElementById('roiDescription').textContent = summaryTexts.narrative;

        // Populate detailed breakdown
        this.populateDetailedBreakdown();
    }

    populateDetailedBreakdown() {
        const detailedResults = document.getElementById('detailedResults');
        if (!detailedResults || !this.results) return;

        let html = '';

        this.results.breakdown.forEach(item => {
            html += `
                <div class="breakdown-item">
                    <div class="breakdown-label">${item.category}</div>
                    <div class="breakdown-value">$${item.amount.toLocaleString()}</div>
                </div>
            `;
        });

        // Add total
        html += `
            <div class="breakdown-item" style="border-top: 2px solid #667eea; font-weight: bold;">
                <div class="breakdown-label">Total Annual Value</div>
                <div class="breakdown-value">$${this.results.metrics.totalAnnualValue.toLocaleString()}</div>
            </div>
            <div class="breakdown-item">
                <div class="breakdown-label">Less: SqlDBM Annual Cost</div>
                <div class="breakdown-value">($${this.calculator.SQLDBM_ANNUAL_COST.toLocaleString()})</div>
            </div>
            <div class="breakdown-item" style="background: #f8f9fa; font-weight: bold;">
                <div class="breakdown-label">Net Annual Value</div>
                <div class="breakdown-value">$${this.results.metrics.netAnnualValue.toLocaleString()}</div>
            </div>
        `;

        detailedResults.innerHTML = html;
    }

    setupCTA() {
        if (!this.results) return;

        // Update CTA with dynamic savings amount
        const ctaSavings = document.getElementById('ctaSavings');
        if (ctaSavings) {
            ctaSavings.textContent = `$${this.results.metrics.totalAnnualValue.toLocaleString()}`;
        }

        // Setup CTA button event handlers
        const demoBtn = document.getElementById('demoBtn');
        const tourBtn = document.getElementById('tourBtn');

        if (demoBtn) {
            demoBtn.addEventListener('click', () => this.handleDemoRequest());
        }

        if (tourBtn) {
            tourBtn.addEventListener('click', () => this.handleTourRequest());
        }
    }

    handleDemoRequest() {
        // Track the demo request
        console.log('Demo requested by:', this.formData);
        
        // You can customize this based on your preferred flow
        const message = `Great choice! Based on your ${this.results.metrics.paybackMonths <= 12 ? 'impressive' : 'strong'} ROI projection, a live demo will show you exactly how to achieve these results.\n\nPlease contact our team at demo@sqldbm.com or call (555) 123-4567 to schedule your personalized demo.\n\nWe'll prepare a demo specifically tailored to ${this.formData.industry} companies like ${this.formData.company}.`;
        
        alert(message);
        
        // Alternative: Open email client
        // const subject = encodeURIComponent(`Demo Request - ${this.formData.company}`);
        // const body = encodeURIComponent(`Hi,\n\nI'd like to schedule a demo of SqlDBM. My ROI analysis shows potential savings of $${this.results.metrics.totalAnnualValue.toLocaleString()} annually.\n\nCompany: ${this.formData.company}\nContact: ${this.formData.firstName} ${this.formData.lastName}\nEmail: ${this.formData.businessEmail}\n\nBest regards`);
        // window.open(`mailto:demo@sqldbm.com?subject=${subject}&body=${body}`);
    }

    handleTourRequest() {
        // Track the tour request
        console.log('Product tour requested by:', this.formData);
        
        const message = `Excellent! A custom product tour will highlight the specific SqlDBM features that drive your $${this.results.metrics.totalAnnualValue.toLocaleString()} annual value projection.\n\nOur team will create a personalized tour showing:\n• How SqlDBM accelerates your modeling workflows\n• Industry-specific features for ${this.formData.industry}\n• Integration with your current tools\n\nContact: tours@sqldbm.com or (555) 123-4567\n\nMention reference: ${this.formData.company}-${Date.now()}`;
        
        alert(message);
        
        // Alternative: Open email client or booking system
        // window.open('https://calendly.com/sqldbm/product-tour');
    }

    async downloadPDF() {
        try {
            this.showLoading();
            
            const result = await this.pdfGenerator.generatePDF(this.results, this.formData);
            
            this.hideLoading();
            
            if (result.success) {
                this.showSuccess(`PDF report "${result.filename}" has been downloaded successfully!`);
            } else {
                this.showError(`Failed to generate PDF: ${result.error}`);
            }
            
        } catch (error) {
            this.hideLoading();
            this.showError('An error occurred while generating the PDF report.');
            console.error('PDF generation error:', error);
        }
    }

    showError(message) {
        // Simple alert for now - could be replaced with a better notification system
        alert(`Error: ${message}`);
    }

    showSuccess(message) {
        // Simple alert for now - could be replaced with a better notification system
        alert(`Success: ${message}`);
    }

    // Utility method to restart the calculator
    restart() {
        location.reload();
    }

    // Method to get current results for external use
    getResults() {
        return this.results;
    }

    // Method to get current form data for external use
    getFormData() {
        return this.formData;
    }

    setupModificationSliders() {
        // Modification panel rework slider
        const modReworkSlider = document.getElementById('modReworkPercent');
        const modReworkValue = document.getElementById('modReworkValue');
        
        if (modReworkSlider && modReworkValue) {
            modReworkSlider.addEventListener('input', (e) => {
                modReworkValue.textContent = e.target.value + '%';
            });
        }

        // Modification panel revision slider
        const modRevisionSlider = document.getElementById('modRevisionPercent');
        const modRevisionValue = document.getElementById('modRevisionValue');
        
        if (modRevisionSlider && modRevisionValue) {
            modRevisionSlider.addEventListener('input', (e) => {
                modRevisionValue.textContent = e.target.value + '%';
            });
        }
    }

    populateModificationPanel() {
        // Store original form data on first calculation
        if (!this.isRecalculation) {
            this.originalFormData = { ...this.formData };
        }

        // Populate modification panel with current values
        const fields = [
            { id: 'modTeamSize', value: this.formData.teamSize },
            { id: 'modStakeholders', value: this.formData.stakeholders },
            { id: 'modDataProducts', value: this.formData.dataProducts },
            { id: 'modCurrentTools', value: this.formData.currentTools },
            { id: 'modTransformationSpend', value: this.formData.transformationSpend },
            { id: 'modTransformationTool', value: this.formData.transformationTool },
            { id: 'modIndustry', value: this.formData.industry },
            { id: 'modCompanySize', value: this.formData.companySize },
            { id: 'modReworkPercent', value: this.formData.reworkPercent },
            { id: 'modRevisionPercent', value: this.formData.revisionPercent }
        ];

        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) {
                element.value = field.value;
                
                // Update slider displays
                if (field.id === 'modReworkPercent') {
                    document.getElementById('modReworkValue').textContent = field.value + '%';
                }
                if (field.id === 'modRevisionPercent') {
                    document.getElementById('modRevisionValue').textContent = field.value + '%';
                }
            }
        });

        // Add modification panel event listeners
        const recalculateBtn = document.getElementById('recalculateBtn');
        if (recalculateBtn) {
            recalculateBtn.addEventListener('click', () => {
                this.recalculateROI();
            });
        }

        const resetInputsBtn = document.getElementById('resetInputsBtn');
        if (resetInputsBtn) {
            resetInputsBtn.addEventListener('click', () => {
                this.resetToOriginalInputs();
            });
        }

        // Setup modification panel sliders
        this.setupModificationSliders();
    }

    updateFormDataFromPanel() {
        // Get values from modification panel
        const modTeamSize = document.getElementById('modTeamSize');
        const modStakeholders = document.getElementById('modStakeholders');
        const modDataProducts = document.getElementById('modDataProducts');
        const modCurrentTools = document.getElementById('modCurrentTools');
        const modTransformationSpend = document.getElementById('modTransformationSpend');
        const modTransformationTool = document.getElementById('modTransformationTool');
        const modIndustry = document.getElementById('modIndustry');
        const modCompanySize = document.getElementById('modCompanySize');
        const modReworkPercent = document.getElementById('modReworkPercent');
        const modRevisionPercent = document.getElementById('modRevisionPercent');

        // Update form data with new values
        if (modTeamSize) this.formData.teamSize = modTeamSize.value;
        if (modStakeholders) this.formData.stakeholders = modStakeholders.value;
        if (modDataProducts) this.formData.dataProducts = modDataProducts.value;
        if (modCurrentTools) this.formData.currentTools = modCurrentTools.value;
        if (modTransformationSpend) this.formData.transformationSpend = modTransformationSpend.value;
        if (modTransformationTool) this.formData.transformationTool = modTransformationTool.value;
        if (modIndustry) this.formData.industry = modIndustry.value;
        if (modCompanySize) this.formData.companySize = modCompanySize.value;
        if (modReworkPercent) this.formData.reworkPercent = modReworkPercent.value;
        if (modRevisionPercent) this.formData.revisionPercent = modRevisionPercent.value;
    }

    async recalculateROI() {
        try {
            // Mark as recalculation (no webhook)
            this.isRecalculation = true;
            
            // Get updated values from modification panel
            this.updateFormDataFromPanel();
            
            // Show loading
            this.showLoading();
            
            // Recalculate with small delay for UX
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Calculate new results
            this.results = this.calculator.calculate(this.formData);
            
            // Hide loading
            this.hideLoading();
            
            // Update results display
            this.updateResultsDisplay();
            
            // Scroll to top of results
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Recalculation error:', error);
            this.hideLoading();
            this.showError('An error occurred while recalculating. Please try again.');
        }
    }

    resetToOriginalInputs() {
        if (!this.originalFormData || Object.keys(this.originalFormData).length === 0) {
            this.showError('No original data to reset to.');
            return;
        }

        // Restore original form data
        this.formData = { ...this.originalFormData };
        
        // Repopulate the modification panel
        this.populateModificationPanel();
        
        // Recalculate with original data
        this.recalculateROI();
    }

    updateResultsDisplay() {
        // Update all result displays
        this.populateResults();
        
        // Reinitialize charts
        this.charts.initializeCharts(this.results);
        
        // Re-setup CTA
        this.setupCTA();
        
        // Animate numbers again
        setTimeout(() => {
            this.charts.animateNumbers(this.results);
        }, 500);
    }

    showModificationSection() {
        const modificationSection = document.getElementById('modificationSection');
        if (modificationSection) {
            modificationSection.style.display = 'block';
        }
    }

    hideModificationSection() {
        const modificationSection = document.getElementById('modificationSection');
        if (modificationSection) {
            modificationSection.style.display = 'none';
        }
    }

    toggleModificationPanel() {
        const modificationSection = document.getElementById('modificationSection');
        const toggleText = document.getElementById('toggleText');
        
        if (modificationSection && toggleText) {
            // Check if section is hidden (either display:none or default hidden state)
            const isHidden = modificationSection.style.display === 'none' || 
                           getComputedStyle(modificationSection).display === 'none';
            
            if (isHidden) {
                this.showModificationSection();
                toggleText.textContent = 'Hide Inputs';
                
                // Scroll to the modification section
                setTimeout(() => {
                    modificationSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            } else {
                this.hideModificationSection();
                toggleText.textContent = 'Adjust Inputs';
            }
        }
    }

    // Helper to get cookie value
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    }

    // Send webhook with lead data and ROI results
    async sendWebhookData() {
        try {
            if (!this.results || !this.formData) {
                console.warn('Missing results or form data for webhook');
                return;
            }

            // Get HubSpot cookie
            const hubspotutk = this.getCookie('hubspotutk');

            // Prepare the JSON payload
            const webhookData = {
                // Contact Information
                firstName: this.formData.firstName || '',
                lastName: this.formData.lastName || '', 
                email: this.formData.businessEmail || '',
                company: this.formData.company || '',
                jobTitle: this.formData.jobTitle || '',
                
                // HubSpot Tracking
                hubspotutk: hubspotutk || '',
                pageUri: window.location.href,
                pageName: document.title,

                // Company Details
                industry: this.formData.industry || '',
                companySize: this.formData.companySize || '',
                region: this.formData.region || '',
                
                // Current Environment
                teamSize: this.formData.teamSize || 0,
                stakeholders: this.formData.stakeholders || 0,
                dataProducts: this.formData.dataProducts || 0,
                currentTools: this.formData.currentTools || '',
                transformationSpend: this.formData.transformationSpend || '0',
                transformationTool: this.formData.transformationTool || '',
                
                // Executive Summary (Key ROI Metrics)
                executiveSummary: {
                    paybackPeriodMonths: Math.round(this.results.metrics.paybackMonths * 10) / 10,
                    annualValueCreated: this.results.metrics.totalAnnualValue,
                    threeYearROI: this.results.metrics.threeYearROI,
                    netThreeYearValue: this.results.metrics.threeYearValue,
                    netAnnualValue: this.results.metrics.netAnnualValue
                },
                
                // Additional Context
                submissionDate: new Date().toISOString(),
                calculatorVersion: '1.0',
                leadSource: 'SqlDBM ROI Calculator'
            };

            // Send to webhook endpoint
            const response = await fetch('https://sqldbm1.app.n8n.cloud/webhook/form-submission', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(webhookData)
            });

            if (response.ok) {
                console.log('Webhook sent successfully');
                // Optionally store success flag for analytics
                this.webhookSent = true;
            } else {
                console.warn('Webhook failed:', response.status, response.statusText);
                this.webhookSent = false;
            }

        } catch (error) {
            console.error('Webhook error:', error);
            this.webhookSent = false;
            // Don't show error to user - webhook failure shouldn't disrupt their experience
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if all required classes are available
    if (typeof FormValidator === 'undefined' || 
        typeof ROICalculator === 'undefined' || 
        typeof ROICharts === 'undefined' || 
        typeof PDFGenerator === 'undefined') {
        console.error('Required classes not loaded');
        return;
    }

    // Initialize the ROI Calculator App
    window.roiApp = new ROICalculatorApp();
    
    console.log('ROI Calculator is ready!');
});

// Export for external use
window.ROICalculatorApp = ROICalculatorApp;