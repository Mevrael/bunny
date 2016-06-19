
export function ready(callback) {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            callback();
        })
    }
}
