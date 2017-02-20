
export const NotifyConfig = {
  useAnimation: true,
  defaultPosition: 'top-right',
  defaultType: 'success',
  classSlideRight: 'slide-right',
  classSlideInLeft: 'slide-in-left',
  tagName: 'alert',
  tagNameContainer: 'notifies',
  attrType: 'brand',
  attrPosition: 'fixed',
  classNameCloser: 'close',
  autoRemoveAfter: 2, //seconds; 0 - do not remove automatically
};

export const Notify = {

  Config: NotifyConfig,

  setType(alert, type) {
    alert.setAttribute(this.Config.attrType, type);
  },

  setPosition(alert, position) {
    alert.setAttribute(this.Config.attrPosition, position);
  },

  show(alert) {
    alert.classList.add(this.Config.classSlideInLeft);
  },

  hide(alert) {
    alert.classList.add(this.Config.classSlideRight);
  },

  remove(alert) {
    alert.parentNode.removeChild(alert);
    this.fireOnRemove(alert);
  },

  hideAndRemove(alert) {
    this.hide(alert);
    if (this.Config.useAnimation) {
      alert.addEventListener('animationend', () => {
        this.remove(alert);
      });
    } else {
      this.remove(alert);
    }
  },

  create(message, type = this.Config.defaultType, position = this.Config.defaultPosition, insideContainer = false) {
    const alert = document.createElement(this.Config.tagName);
    alert.innerHTML = message;
    this.setType(alert, type);
    if (insideContainer) {
      let container = this.getContainer();
      if (container === false) {
        container = this.createContainer(position);
        document.body.appendChild(container);
      }
    } else {
      this.setPosition(alert, position);
    }
    return alert;
  },

  createCloser() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = this.Config.classNameCloser;
    btn.dataset.dismiss = 'alert';
    btn.setAttribute('aria-label', 'Close');
    return btn;
  },

  createAndInit(message, type = this.Config.defaultType, position = this.Config.defaultPosition, insideContainer = false, autoRemoveAfter = this.Config.autoRemoveAfter) {
    const alert = this.create(message, type, position, insideContainer);
    if (insideContainer) {
      this.getContainer().appendChild(alert);
    } else {
      document.body.appendChild(alert);
    }
    this.show(alert);
    this.addEvents(alert, autoRemoveAfter);
  },

  createContainer(position = this.Config.defaultPosition) {
    const el = document.createElement(this.Config.tagNameContainer);
    this.setPosition(el, position);
    return el;
  },

  hasContainer(alert) {
    return alert.parentNode.tagName === this.Config.tagNameContainer;
  },

  getContainer() {
    return document.getElementsByTagName(this.Config.tagNameContainer) [0] || false;
  },

  getCloser(alert) {
    return alert.getElementsByClassName(this.Config.classNameCloser)[0] || false;
  },

  addEvents(alert, autoRemoveAfter = this.Config.autoRemoveAfter) {
    alert.addEventListener('click', () => {
      this.hideAndRemove(alert);
    });
    if (autoRemoveAfter > 0) {
      setTimeout(() => {
        this.hideAndRemove(alert);
      }, autoRemoveAfter * 1000);
    }
  },

  onRemove(alert, callback) {
    if (alert.__notify_cb === undefined) {
      alert.__notify_cb = [];
    }
    alert.__notify_cb.push(callback);
  },

  fireOnRemove(alert) {
    if (alert.__notify_cb !== undefined) {
      alert.__notify_cb.forEach(cb => {
        cb();
      });
    }
  },

  success(message, autoRemoveAfter = this.Config.autoRemoveAfter) {
    this.createAndInit(message, 'success', this.Config.defaultPosition, true, autoRemoveAfter);
  },

  info(message, autoRemoveAfter = this.Config.autoRemoveAfter) {
    this.createAndInit(message, 'info', this.Config.defaultPosition, true, autoRemoveAfter);
  },

  warning(message, autoRemoveAfter = this.Config.autoRemoveAfter) {
    this.createAndInit(message, 'warning', this.Config.defaultPosition, true, autoRemoveAfter);
  },

  danger(message, autoRemoveAfter = this.Config.autoRemoveAfter) {
    this.createAndInit(message, 'danger', this.Config.defaultPosition, true, autoRemoveAfter);
  },

};
