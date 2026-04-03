document.addEventListener("DOMContentLoaded", () => {
    // 1. Radial Gauges Animation
    const progressCircles = document.querySelectorAll('.radial-progress');
    const PI2_R = 125.6; // ~ 2 * PI * 20

    setTimeout(() => {
        progressCircles.forEach(circle => {
            const percentage = parseFloat(circle.getAttribute('data-percentage')) || 0;
            // offset calculates what's NOT filled
            const offset = PI2_R - (percentage / 100) * PI2_R;
            circle.style.strokeDashoffset = offset;
        });
    }, 300); // Slight delay for the cool animation effect on load

    // 2. Sparkline Logic
    // We expect two canvases based on the HTML mockup
    const sparklines = document.querySelectorAll('.sparkline-canvas');

    if (sparklines.length > 0 && typeof Chart !== 'undefined') {
        // Chart defaults specifically for these micro charts
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    intersect: false,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 10 },
                    bodyFont: { size: 10 }
                }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            elements: {
                line: { tension: 0.4, borderWidth: 2 },
                point: { radius: 0, hitRadius: 8, hoverRadius: 4 }
            },
            layout: { padding: 0 }
        };

        // First row sparkline (In Progress, rising trend)
        const ctx1 = sparklines[0].getContext('2d');
        const grad1 = ctx1.createLinearGradient(0, 0, 0, 32);
        grad1.addColorStop(0, 'rgba(14, 165, 233, 0.4)');
        grad1.addColorStop(1, 'rgba(14, 165, 233, 0)');

        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                datasets: [{
                    data: [12, 14, 25, 22, 38, 45, 41],
                    borderColor: '#0284c7', // brand-600
                    backgroundColor: grad1,
                    fill: true
                }]
            },
            options: commonOptions
        });

        // Second row sparkline (Completed, stable/dropping trend)
        if (sparklines.length > 1) {
            const ctx2 = sparklines[1].getContext('2d');
            const grad2 = ctx2.createLinearGradient(0, 0, 0, 32);
            grad2.addColorStop(0, 'rgba(5, 150, 105, 0.4)'); // Emerald
            grad2.addColorStop(1, 'rgba(5, 150, 105, 0)');

            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                    datasets: [{
                        data: [50, 48, 45, 46, 38, 30, 28],
                        borderColor: '#059669', // Emerald
                        backgroundColor: grad2,
                        fill: true
                    }]
                },
                options: commonOptions
            });
        }
    }
});
