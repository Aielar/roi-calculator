// Charts and visualizations
class ROICharts {
    constructor() {
        this.charts = {};

        // Text/grid colors differ between the on-screen dark UI and the
        // white-background PDF export. Charts render with screen colors by
        // default; PDFGenerator calls setMode('export') right before it
        // screenshots the canvas, then setMode('screen') to restore.
        this.screenColors = {
            text: '#E2E8F0',                    // light text for the dark UI
            grid: 'rgba(226, 232, 240, 0.12)'   // subtle light grid lines
        };
        this.exportColors = {
            text: '#1F2937',                    // dark text for the white PDF page
            grid: 'rgba(31, 41, 55, 0.2)'
        };

        this.colors = {
            primary: '#667eea',
            secondary: '#764ba2',
            success: '#10B981',
            warning: '#F59E0B',
            info: '#3B82F6',
            light: '#F8FAFC',
            dark: '#0B1120',
            text: this.screenColors.text, // default to on-screen (dark UI)
            grid: this.screenColors.grid,
            error: '#EF4444'
        };

        this.gradients = {};
    }

    // Swap text/grid colors for screen vs. PDF export and re-render all charts.
    // mode: 'screen' (light text, dark UI) | 'export' (dark text, white PDF page)
    setMode(mode) {
        const palette = mode === 'export' ? this.exportColors : this.screenColors;
        this.colors.text = palette.text;
        this.colors.grid = palette.grid;

        Object.values(this.charts).forEach(chart => {
            if (!chart || !chart.options) return;
            const opts = chart.options;

            if (opts.scales) {
                ['x', 'y'].forEach(axis => {
                    const scale = opts.scales[axis];
                    if (!scale) return;
                    if (scale.ticks) scale.ticks.color = palette.text;
                    if (scale.title) scale.title.color = palette.text;
                    if (scale.grid && scale.grid.display !== false) {
                        scale.grid.color = palette.grid;
                    }
                });
            }

            if (opts.plugins) {
                if (opts.plugins.legend && opts.plugins.legend.labels) {
                    opts.plugins.legend.labels.color = palette.text;
                }
                if (opts.plugins.datalabels) {
                    opts.plugins.datalabels.color = palette.text;
                }
            }

            // The custom percentageLabels plugin reads this.colors.text at draw
            // time, so it picks up the new color on this update automatically.
            chart.update('none');
        });
    }

    createGradient(ctx, color1, color2) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        return gradient;
    }

    initializeCharts(results) {
        // Destroy existing charts
        this.destroyCharts();
        
        // Create value breakdown chart
        this.createValueBreakdownChart(results.breakdown);
        
        // Create ROI timeline chart
        this.createROITimelineChart(results.timeline);
    }

    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    createValueBreakdownChart(breakdown) {
        const ctx = document.getElementById('valueBreakdownChart');
        if (!ctx) return;

        // Calculate percentages for data labels
        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
        const percentages = breakdown.map(item => Math.round((item.amount / total) * 100));

        const data = {
            labels: breakdown.map(item => item.category),
            datasets: [{
                label: 'Annual Savings',
                data: breakdown.map(item => item.amount),
                backgroundColor: [
                    this.colors.primary,
                    this.colors.secondary,
                    this.colors.success,
                    this.colors.info
                ],
                borderColor: [
                    this.colors.primary,
                    this.colors.secondary,
                    this.colors.success,
                    this.colors.info
                ],
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
            }]
        };

        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Horizontal bar chart
                plugins: {
                    legend: {
                        display: false // Hide legend since we only have one dataset
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: this.colors.text,
                        bodyColor: this.colors.text,
                        borderColor: this.colors.grid,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.x;
                                const percentage = percentages[context.dataIndex];
                                return `$${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'right',
                        color: this.colors.text,
                        font: {
                            weight: 'bold',
                            size: 11
                        },
                        formatter: function(value, context) {
                            const percentage = percentages[context.dataIndex];
                            return `${percentage}%`;
                        },
                        padding: {
                            left: 10
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: this.colors.grid
                        },
                        title: {
                            display: true,
                            text: 'Annual Savings ($)',
                            color: this.colors.text,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: this.colors.text,
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'K';
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: this.colors.text,
                            font: {
                                size: 11
                            },
                            callback: function(value, index) {
                                // Truncate long labels
                                const label = this.getLabelForValue(value);
                                return label.length > 25 ? label.substring(0, 22) + '...' : label;
                            }
                        }
                    }
                },
                elements: {
                    bar: {
                        borderWidth: 1
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: {
                        right: 50 // Extra space for percentage labels
                    }
                }
            },
            plugins: [{
                // Custom plugin to draw percentage labels
                id: 'percentageLabels',
                afterDatasetsDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((bar, index) => {
                            const percentage = percentages[index];
                            
                            // Position for the label
                            const x = bar.x + 10;
                            const y = bar.y + 4;
                            
                            // Style the text
                            ctx.fillStyle = this.colors.text;
                            ctx.font = 'bold 12px Inter, sans-serif';
                            ctx.textAlign = 'left';
                            ctx.textBaseline = 'middle';
                            
                            // Draw percentage
                            ctx.fillText(`${percentage}%`, x, y);
                        });
                    });
                    
                    ctx.restore();
                }
            }]
        };

        this.charts.valueBreakdown = new Chart(ctx, config);
    }

    createROITimelineChart(timeline) {
        const ctx = document.getElementById('roiTimelineChart');
        if (!ctx) return;

        // Get canvas context for gradients
        const canvasCtx = ctx.getContext('2d');
        
        const valueGradient = this.createGradient(canvasCtx, 'rgba(102, 126, 234, 0.5)', 'rgba(102, 126, 234, 0.0)');
        const costGradient = this.createGradient(canvasCtx, 'rgba(239, 68, 68, 0.5)', 'rgba(239, 68, 68, 0.0)');
        const netGradient = this.createGradient(canvasCtx, 'rgba(16, 185, 129, 0.5)', 'rgba(16, 185, 129, 0.0)');

        // Filter timeline to show every 3 months for first year, then every 6 months
        const filteredTimeline = timeline.filter((item, index) => {
            if (item.month <= 12) {
                return item.month % 3 === 0; // Every 3 months for first year
            } else {
                return item.month % 6 === 0; // Every 6 months after
            }
        });

        const data = {
            labels: filteredTimeline.map(item => {
                if (item.month <= 12) {
                    return `Month ${item.month}`;
                } else {
                    return `Year ${Math.ceil(item.month / 12)}`;
                }
            }),
            datasets: [
                {
                    label: 'Cumulative Value',
                    data: filteredTimeline.map(item => item.cumulativeValue),
                    borderColor: this.colors.primary,
                    backgroundColor: valueGradient,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: this.colors.light,
                    pointBorderWidth: 2,
                    pointRadius: 4
                },
                {
                    label: 'Cumulative Cost',
                    data: filteredTimeline.map(item => item.cumulativeCost),
                    borderColor: this.colors.error,
                    backgroundColor: costGradient,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.colors.error,
                    pointBorderColor: this.colors.light,
                    pointBorderWidth: 2,
                    pointRadius: 4
                },
                {
                    label: 'Net Value',
                    data: filteredTimeline.map(item => item.netValue),
                    borderColor: this.colors.success,
                    backgroundColor: netGradient,
                    fill: false,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: this.colors.success,
                    pointBorderColor: this.colors.light,
                    pointBorderWidth: 2,
                    pointRadius: 5
                }
            ]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: this.colors.text,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: this.colors.text,
                        bodyColor: this.colors.text,
                        borderColor: this.colors.grid,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: $${value.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Timeline',
                            color: this.colors.text
                        },
                        ticks: {
                            color: this.colors.text
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: this.colors.grid
                        },
                        title: {
                            display: true,
                            text: 'Value ($)',
                            color: this.colors.text
                        },
                        ticks: {
                            color: this.colors.text,
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'K';
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        };

        this.charts.timeline = new Chart(ctx, config);
    }

    // Create a simple bar chart for comparison (optional)
    createComparisonChart(data, elementId) {
        const ctx = document.getElementById(elementId);
        if (!ctx) return;

        const config = {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Value',
                    data: data.values,
                    backgroundColor: this.colors.primary,
                    borderColor: this.colors.secondary,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: this.colors.text,
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'K';
                            }
                        },
                        grid: {
                            color: this.colors.grid
                        }
                    },
                    x: {
                        ticks: {
                            color: this.colors.text
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    // Animate number counters
    animateNumbers(results) {
        this.animateCounter('roiSummary', 0, results.metrics.threeYearROI, 2000, (value) => `${value.toFixed(1)}x`);
        this.animateCounter('paybackPeriod', 0, results.metrics.paybackMonths, 2000, (value) => {
            const months = Math.round(value);
            if (months < 12) {
                return `${months} months`;
            } else {
                const years = Math.floor(months / 12);
                const remainingMonths = months % 12;
                if (remainingMonths === 0) {
                    return `${years} year${years > 1 ? 's' : ''}`;
                } else {
                    return `${years}y ${remainingMonths}m`;
                }
            }
        });
        this.animateCounter('annualValue', 0, results.metrics.totalAnnualValue, 2000, (value) => `$${Math.round(value).toLocaleString()}`);
        this.animateCounter('threeYearROI', 0, results.metrics.threeYearValue, 2000, (value) => `$${Math.round(value).toLocaleString()}`);
    }

    animateCounter(elementId, start, end, duration, formatter) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startTime = performance.now();
        const startValue = start;
        const endValue = end;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (endValue - startValue) * easeOutQuart;
            
            element.textContent = formatter(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Update chart colors based on theme
    updateTheme(isDark = false) {
        // Theme is now handled by default colors
    }
}

// Export for use in other scripts
window.ROICharts = ROICharts;
