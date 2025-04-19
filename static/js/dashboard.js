/**
 * SoundSphere Dashboard JavaScript
 * This script handles all the chart and interactive functionality for the admin dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard script loaded');
    
    // Initialize all charts
    initSalesChart();
    initCategoryChart();
    initRevenueMetrics();
    
    // Set up date range filters
    setupDateFilters();
    
    // Initialize responsive behaviors
    setupResponsiveLayout();
});

/**
 * Initialize the main sales overview chart
 */
function initSalesChart() {
    const salesChartElement = document.getElementById('salesChart');
    if (!salesChartElement) return;
    
    const ctx = salesChartElement.getContext('2d');
    
    // Get theme colors from CSS variables
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const primaryLightColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-100').trim() || 'rgba(59, 130, 246, 0.2)';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e5e7eb';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e5e7eb';
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
    
    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, primaryLightColor);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Sample data - in a real app, this would come from backend
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesData = [65, 59, 80, 81, 56, 55, 40, 84, 64, 75, 90, 85];
    
    // Create chart
    const salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Sales',
                data: salesData,
                backgroundColor: gradient,
                borderColor: primaryColor,
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: cardBg,
                pointBorderColor: primaryColor,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11
                        },
                        padding: 10,
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11
                        },
                        padding: 10
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                    labels: {
                        color: textColor
                    }
                },
                tooltip: {
                    backgroundColor: cardBg,
                    titleColor: textColor,
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    },
                    bodyColor: textColor,
                    bodyFont: {
                        size: 12
                    },
                    padding: 12,
                    borderColor: borderColor,
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '$' + context.raw;
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            hover: {
                mode: 'nearest',
                intersect: true
            }
        }
    });
    
    // Update chart colors when theme changes
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === "data-theme") {
                updateChartColors(salesChart);
            }
        });
    });
    
    observer.observe(htmlElement, { attributes: true });
    
    // Set up time period filter buttons
    const timeFilterButtons = document.querySelectorAll('.btn-group button');
    if (timeFilterButtons.length > 0) {
        timeFilterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                timeFilterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update chart data based on selected time period
                // This would typically fetch data from the server
                let newData;
                const period = this.textContent.trim().toLowerCase();
                
                if (period === 'week') {
                    newData = [12, 19, 13, 17, 20, 25, 32];
                    salesChart.data.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                } else if (period === 'month') {
                    newData = [42, 38, 35, 27, 43, 47, 38, 35, 42, 27, 35, 32, 43, 47, 41, 38, 42, 45, 35, 38, 32, 28, 35, 40, 38, 32, 28, 30, 32, 35];
                    salesChart.data.labels = Array.from({length: 30}, (_, i) => i + 1);
                } else {
                    newData = salesData;
                    salesChart.data.labels = labels;
                }
                
                salesChart.data.datasets[0].data = newData;
                salesChart.update();
            });
        });
    }
}

/**
 * Initialize the category breakdown chart (donut/pie chart)
 */
function initCategoryChart() {
    const categoryChartElement = document.getElementById('categoryChart');
    if (!categoryChartElement) return;
    
    const ctx = categoryChartElement.getContext('2d');
    
    // Get theme colors
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3b82f6';
    const secondary = getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#6366f1';
    const success = getComputedStyle(document.documentElement).getPropertyValue('--success').trim() || '#10b981';
    const warning = getComputedStyle(document.documentElement).getPropertyValue('--warning').trim() || '#f59e0b';
    const danger = getComputedStyle(document.documentElement).getPropertyValue('--danger').trim() || '#ef4444';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
    
    // Create chart
    const categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Headphones', 'Speakers', 'Accessories', 'Vinyl', 'Other'],
            datasets: [{
                data: [35, 25, 20, 15, 5],
                backgroundColor: [primary, secondary, success, warning, danger],
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: textColor
                    }
                },
                tooltip: {
                    backgroundColor: cardBg,
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim(),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${context.label}: ${percentage}%`;
                        }
                    }
                }
            }
        }
    });
    
    // Update chart colors when theme changes
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === "data-theme") {
                updateChartColors(categoryChart);
            }
        });
    });
    
    observer.observe(htmlElement, { attributes: true });
}

/**
 * Initialize the revenue metrics and small charts
 */
function initRevenueMetrics() {
    const revenueByDeviceElement = document.getElementById('revenueByDeviceChart');
    if (!revenueByDeviceElement) return;
    
    const ctx = revenueByDeviceElement.getContext('2d');
    
    // Get theme colors
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3b82f6';
    const success = getComputedStyle(document.documentElement).getPropertyValue('--success').trim() || '#10b981';
    const warning = getComputedStyle(document.documentElement).getPropertyValue('--warning').trim() || '#f59e0b';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e5e7eb';
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
    
    // Create chart
    const revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Desktop', 'Mobile', 'Tablet'],
            datasets: [{
                label: 'Revenue by Device',
                data: [65, 25, 10],
                backgroundColor: [primary, success, warning],
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: textColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: cardBg,
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim(),
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return context.raw + '%';
                        }
                    }
                }
            }
        }
    });
    
    // Update chart colors when theme changes
    const htmlElement = document.documentElement;
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === "data-theme") {
                updateChartColors(revenueChart);
            }
        });
    });
    
    observer.observe(htmlElement, { attributes: true });
}

/**
 * Helper function to update chart colors when theme changes
 */
function updateChartColors(chart) {
    // Get updated theme colors
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim();
    
    // Update chart options
    if (chart.options.scales.y) {
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.y.grid.color = borderColor;
    }
    
    if (chart.options.scales.x) {
        chart.options.scales.x.ticks.color = textColor;
    }
    
    if (chart.options.plugins.legend && chart.options.plugins.legend.labels) {
        chart.options.plugins.legend.labels.color = textColor;
    }
    
    if (chart.options.plugins.tooltip) {
        chart.options.plugins.tooltip.backgroundColor = cardBg;
        chart.options.plugins.tooltip.titleColor = textColor;
        chart.options.plugins.tooltip.bodyColor = textColor;
        chart.options.plugins.tooltip.borderColor = borderColor;
    }
    
    // For line charts, update point backgrounds
    if (chart.config.type === 'line' && chart.data.datasets[0]) {
        chart.data.datasets[0].pointBackgroundColor = cardBg;
    }
    
    // Update the chart with new options
    chart.update();
}

/**
 * Set up date range filters for dashboard data
 */
function setupDateFilters() {
    const dateRangeSelect = document.getElementById('dateRangeSelect');
    if (!dateRangeSelect) return;
    
    dateRangeSelect.addEventListener('change', function() {
        console.log('Date range changed to:', this.value);
        // This would typically trigger an AJAX request to refresh data
        // For demo purposes, we'll just log it
    });
}

/**
 * Set up responsive behaviors for dashboard
 */
function setupResponsiveLayout() {
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (!dashboardContainer) return;
    
    // Monitor for screen size changes
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    function handleScreenChange(e) {
        if (e.matches) {
            console.log('Mobile view activated');
            // Apply mobile optimizations
        } else {
            console.log('Desktop view activated');
            // Apply desktop optimizations
        }
    }
    
    // Initial check
    handleScreenChange(mediaQuery);
    
    // Add listener for changes
    mediaQuery.addEventListener('change', handleScreenChange);
} 