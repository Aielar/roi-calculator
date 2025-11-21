// PDF Generation functionality
class PDFGenerator {
    constructor() {
        this.pageWidth = 210; // A4 width in mm
        this.pageHeight = 297; // A4 height in mm
        this.margin = 15;
        this.contentWidth = this.pageWidth - (2 * this.margin);
        this.colors = {
            primary: [102, 126, 234], // #667eea
            secondary: [118, 75, 162], // #764ba2
            text: [51, 51, 51],
            lightText: [100, 100, 100],
            background: [248, 249, 250],
            white: [255, 255, 255],
            border: [233, 236, 239],
            success: [40, 167, 69]
        };
    }

    async generatePDF(results, formData) {
        try {
            // Create new jsPDF instance
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Capture charts
            const charts = await this.captureCharts();

            // Page 1: Executive Summary & Visuals
            this.addHeader(doc);
            this.addCompanyInfo(doc, formData);
            this.addExecutiveSummary(doc, results);
            
            // Add charts if captured successfully
            if (charts.breakdown && charts.timeline) {
                this.addCharts(doc, charts);
            }

            this.addBusinessInsight(doc);
            this.addFooter(doc, 1);

            // Page 2: Detailed Breakdown & Calculations
            doc.addPage();
            this.addHeader(doc, true); // Simplified header
            this.addDetailedBreakdown(doc, results);
            this.addAssumptions(doc);
            this.addCalculationDetails(doc, results);
            this.addFooter(doc, 2);

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const companyName = formData.company.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `SqlDBM_ROI_Analysis_${companyName}_${timestamp}.pdf`;

            // Save the PDF
            doc.save(filename);

            return { success: true, filename: filename };

        } catch (error) {
            console.error('PDF Generation Error:', error);
            return { success: false, error: error.message };
        }
    }

    async captureCharts() {
        const charts = {};
        try {
            const breakdownCanvas = document.getElementById('valueBreakdownChart');
            const timelineCanvas = document.getElementById('roiTimelineChart');

            if (breakdownCanvas) {
                charts.breakdown = breakdownCanvas.toDataURL('image/png');
            }
            if (timelineCanvas) {
                charts.timeline = timelineCanvas.toDataURL('image/png');
            }
        } catch (e) {
            console.warn('Error capturing charts:', e);
        }
        return charts;
    }

    addHeader(doc, simplified = false) {
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.primary);
        doc.text('SqlDBM ROI Analysis', this.margin, 20);

        if (!simplified) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...this.colors.lightText);
            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            doc.text(`Generated on ${currentDate} - Contact us at: sales@sqldbm.com`, this.margin, 28);
        }

        // Separator
        doc.setDrawColor(...this.colors.primary);
        doc.setLineWidth(0.5);
        doc.line(this.margin, 32, this.pageWidth - this.margin, 32);
    }

    addCompanyInfo(doc, formData) {
        const yPos = 42;
        
        // Background box
        doc.setFillColor(...this.colors.background);
        doc.setDrawColor(...this.colors.border);
        doc.roundedRect(this.margin, yPos, this.contentWidth, 25, 3, 3, 'FD');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.text);
        
        // Column 1
        doc.text(formData.company, this.margin + 5, yPos + 8);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...this.colors.lightText);
        doc.text(`${this.formatIndustry(formData.industry)} • ${this.formatCompanySize(formData.companySize)}`, this.margin + 5, yPos + 16);

        // Column 2 (Right aligned)
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.text);
        doc.text(`Prepared for: ${formData.firstName} ${formData.lastName}`, this.pageWidth - this.margin - 5, yPos + 8, { align: 'right' });
        doc.setTextColor(...this.colors.lightText);
        doc.text(formData.businessEmail, this.pageWidth - this.margin - 5, yPos + 16, { align: 'right' });
    }

    addExecutiveSummary(doc, results) {
        const yPos = 75;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.text);
        doc.text('Executive Summary', this.margin, yPos);

        const startY = yPos + 5;
        const boxWidth = (this.contentWidth - 15) / 4; // 4 boxes
        const boxHeight = 30;

        const metrics = [
            {
                label: 'Payback Period',
                value: results.metrics.paybackMonths <= 12 
                    ? `${Math.round(results.metrics.paybackMonths)} months`
                    : `${Math.round(results.metrics.paybackMonths / 12 * 10) / 10} years`,
                color: [40, 167, 69] // Success green
            },
            {
                label: 'Annual Value',
                value: `$${this.formatCompactNumber(results.metrics.totalAnnualValue)}`,
                color: [102, 126, 234] // Primary blue
            },
            {
                label: '3-Year ROI',
                value: `${results.metrics.threeYearROI}x`,
                color: [118, 75, 162] // Secondary purple
            },
            {
                label: 'Net 3-Year Value',
                value: `$${this.formatCompactNumber(results.metrics.threeYearValue)}`,
                color: [23, 162, 184] // Info cyan
            }
        ];

        metrics.forEach((metric, index) => {
            const x = this.margin + (index * (boxWidth + 5));
            
            // Card background
            doc.setFillColor(...this.colors.white);
            doc.setDrawColor(...this.colors.border);
            doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'FD');

            // Label
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...this.colors.lightText);
            doc.text(metric.label.toUpperCase(), x + (boxWidth/2), startY + 8, { align: 'center' });

            // Value
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...metric.color);
            doc.text(metric.value, x + (boxWidth/2), startY + 20, { align: 'center' });
        });
    }

    addCharts(doc, charts) {
        const yPos = 120;
        const chartHeight = 70;
        const chartWidth = (this.contentWidth - 10) / 2;

        // Chart 1 Title
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.text);
        doc.text('Annual Value Creation', this.margin, yPos);

        // Chart 2 Title
        doc.text('ROI Timeline (3 Years)', this.margin + chartWidth + 10, yPos);

        // Add Images
        if (charts.breakdown) {
            doc.addImage(charts.breakdown, 'PNG', this.margin, yPos + 5, chartWidth, chartHeight);
        }
        if (charts.timeline) {
            doc.addImage(charts.timeline, 'PNG', this.margin + chartWidth + 10, yPos + 5, chartWidth, chartHeight);
        }
    }

    addBusinessInsight(doc) {
        const yPos = 210;
        
        doc.setFillColor(...this.colors.background);
        doc.setDrawColor(...this.colors.primary);
        doc.setLineWidth(0.5);
        doc.roundedRect(this.margin, yPos, this.contentWidth, 30, 2, 2, 'FD');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.primary);
        doc.text('Key Business Insight', this.margin + 10, yPos + 10);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...this.colors.text);
        const text = 'While data modeling may not directly generate revenue, SqlDBM transforms it into a business accelerator. Your analysis shows how improved efficiency, reduced rework, and enhanced downstream productivity create substantial cost savings.';
        const lines = doc.splitTextToSize(text, this.contentWidth - 20);
        doc.text(lines, this.margin + 10, yPos + 18);
    }

    addDetailedBreakdown(doc, results) {
        let yPos = 40;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.text);
        doc.text('Detailed Value Breakdown', this.margin, yPos);

        yPos += 10;

        // Table Header
        const colWidths = [90, 50, 40]; // Total 180
        const startX = this.margin;
        
        doc.setFillColor(...this.colors.primary);
        doc.rect(startX, yPos, this.contentWidth, 10, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.white);
        doc.text('Value Category', startX + 5, yPos + 7);
        doc.text('Annual Savings', startX + colWidths[0] + 5, yPos + 7);
        doc.text('% of Total', startX + colWidths[0] + colWidths[1] + 5, yPos + 7);

        yPos += 10;

        // Table Rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...this.colors.text);

        results.breakdown.forEach((item, index) => {
            if (index % 2 === 0) {
                doc.setFillColor(...this.colors.background);
                doc.rect(startX, yPos, this.contentWidth, 10, 'F');
            }

            doc.text(item.category, startX + 5, yPos + 7);
            doc.text(`$${item.amount.toLocaleString()}`, startX + colWidths[0] + 5, yPos + 7);
            doc.text(`${item.percentage}%`, startX + colWidths[0] + colWidths[1] + 5, yPos + 7);
            
            yPos += 10;
        });

        // Total Row
        yPos += 2;
        doc.setDrawColor(...this.colors.text);
        doc.setLineWidth(0.2);
        doc.line(startX, yPos, startX + this.contentWidth, yPos);
        
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Total Annual Value', startX + 5, yPos);
        doc.text(`$${results.metrics.totalAnnualValue.toLocaleString()}`, startX + colWidths[0] + 5, yPos);
    }

    addAssumptions(doc) {
        let yPos = 120;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Assumptions', this.margin, yPos);

        yPos += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...this.colors.lightText);

        const assumptions = [
            '• SqlDBM annual platform cost: $120,000 (Enterprise estimate)',
            '• Average loaded FTE cost: $150,000',
            '• Default efficiency improvement: 20-40%',
            '• Rework reduction: 15-25%',
            '• Stakeholder time savings: 2-4 hours/month'
        ];

        assumptions.forEach(assumption => {
            doc.text(assumption, this.margin, yPos);
            yPos += 5;
        });
    }

    addCalculationDetails(doc, results) {
        let yPos = 160;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.text);
        doc.text('Calculation Methodology', this.margin, yPos);

        yPos += 10;
        
        const calculations = [
            {
                title: '1. Labor Efficiency',
                formula: `Team Size (${results.inputs.teamSize}) × FTE Cost ($150k) × Time Saved (${results.savings.laborEfficiency.timeSavedPercent}%)`,
                result: `$${results.savings.laborEfficiency.annualSavings.toLocaleString()}`
            },
            {
                title: '2. Rework Reduction',
                formula: `Models (${results.inputs.dataProducts}) × Hrs/Model (80) × Rate ($75) × Avoided (${results.savings.reworkReduction.reworkAvoided}%)`,
                result: `$${results.savings.reworkReduction.annualSavings.toLocaleString()}`
            },
            {
                title: '3. Downstream Productivity',
                formula: `Stakeholders (${results.inputs.stakeholders}) × Hrs Saved (${results.savings.downstreamProductivity.hoursSavedPerMonth}) × Rate ($60) × 12mo`,
                result: `$${results.savings.downstreamProductivity.annualSavings.toLocaleString()}`
            }
        ];

        calculations.forEach(calc => {
            // Box
            doc.setDrawColor(...this.colors.border);
            doc.setFillColor(...this.colors.white);
            doc.roundedRect(this.margin, yPos, this.contentWidth, 25, 2, 2, 'S');

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...this.colors.primary);
            doc.text(calc.title, this.margin + 5, yPos + 8);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...this.colors.lightText);
            doc.text(calc.formula, this.margin + 5, yPos + 18);

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...this.colors.success); // Green for money
            doc.text(calc.result, this.pageWidth - this.margin - 5, yPos + 15, { align: 'right' });

            yPos += 30;
        });
    }

    addCallToAction(doc, results) {
        let yPos = 80;
        
        // Hero Box
        doc.setFillColor(...this.colors.primary);
        doc.rect(0, yPos, this.pageWidth, 60, 'F');

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.white);
        doc.text('Ready to Realize These Savings?', this.pageWidth/2, yPos + 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Schedule a personalized demo to see how SqlDBM fits your environment.', this.pageWidth/2, yPos + 35, { align: 'center' });

        // Button simulation
        const btnWidth = 60;
        const btnHeight = 15;
        const btnX = (this.pageWidth - btnWidth) / 2;
        const btnY = yPos + 45;

        doc.setFillColor(...this.colors.white);
        doc.roundedRect(btnX, btnY, btnWidth, btnHeight, 8, 8, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.primary);
        doc.text('Book a Demo', this.pageWidth/2, btnY + 10, { align: 'center' });

        // Contact info
        yPos += 80;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...this.colors.text);
        doc.text('Contact us at: sales@sqldbm.com', this.pageWidth/2, yPos, { align: 'center' });
        doc.text('www.sqldbm.com', this.pageWidth/2, yPos + 6, { align: 'center' });
    }

    addFooter(doc, pageNum) {
        const yPos = this.pageHeight - 10;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...this.colors.lightText);
        doc.text('© 2025 SqlDBM. All rights reserved.', this.margin, yPos);
        doc.text(`Page ${pageNum}`, this.pageWidth - this.margin, yPos, { align: 'right' });
    }

    // Helpers
    formatIndustry(value) {
        if (!value) return 'N/A';
        return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    formatCompanySize(value) {
        if (!value) return 'N/A';
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    formatCompactNumber(number) {
        if (number >= 1000000) {
            return (number / 1000000).toFixed(1) + 'M';
        }
        if (number >= 1000) {
            return (number / 1000).toFixed(0) + 'k';
        }
        return number.toString();
    }
}