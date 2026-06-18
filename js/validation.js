document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        if (input.type === 'number' || input.type === 'range') {
            input.addEventListener('input', (e) => {
                let val = parseFloat(e.target.value);
                let min = parseFloat(e.target.min);
                let max = parseFloat(e.target.max);
                if (isNaN(val)) return;
                if (!isNaN(min) && val < min) { e.target.value = min; if(e.target.oninput) e.target.dispatchEvent(new Event('input', {bubbles: true, cancelable: true})); }
                if (!isNaN(max) && val > max) { e.target.value = max; if(e.target.oninput) e.target.dispatchEvent(new Event('input', {bubbles: true, cancelable: true})); }
            });
            input.addEventListener('change', (e) => {
                let val = parseFloat(e.target.value);
                let min = parseFloat(e.target.min);
                if (isNaN(val)) { e.target.value = min || 0; if(e.target.onchange) e.target.dispatchEvent(new Event('change', {bubbles: true, cancelable: true})); }
            });
        }
    });
});