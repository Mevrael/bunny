
export const Alert = {

    className: 'alert',
    classFade: 'fade',
    classFadeIn: 'active',
    classCloseBtn: 'close',
    animationDuration: 150,

    init(alert) {
        this.addEvents(alert);
    },

    initAll(node = document) {
        const alerts = node.getElementsByClassName(this.className);
        [].forEach.call(alerts, alert => {
            this.init(alert);
        })
    },

    addEvents(alert) {
        const btn = this.getCloseBtn(alert);
        if (btn) {
            btn.addEventListener('click', () => {
                this.close(alert);
            })
        }
    },

    getCloseBtn(alert) {
        return alert.getElementsByClassName(this.classCloseBtn)[0] || false;
    },

    hasAnimation(alert) {
        return alert.classList.contains(this.classFade);
    },

    show(alert) {
        return new Promise(resolve => {
            alert.classList.add(this.classFadeIn);
            setTimeout(resolve, this.animationDuration);
        });
    },

    hide(alert) {
        return new Promise(resolve => {
            alert.classList.remove(this.classFadeIn);
            setTimeout(resolve, this.animationDuration);
        });
    },

    remove(alert) {
        alert.parentNode.removeChild(alert);
    },

    close(alert) {
        if (this.hasAnimation(alert)) {
            this.hide(alert).then(() => {
                this.remove(alert);
            })
        } else {
            this.remove(alert);
        }
    }

};

document.addEventListener('DOMContentLoaded', () => {
    Alert.initAll();
});
