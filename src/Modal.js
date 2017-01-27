
import { onClickOutside, removeClickOutside, addEvent, removeEvent } from './utils/DOM';

export const ModalConfig = {

  tagName: 'modal',
  tagNameBackdrop: 'fade',
  tagNameCloser: 'button',
  classNameShow: 'show',
  classNameCloser: 'close',
  classNameSlideOut: 'slide-top',
  classNameSlideIn: 'slide-in-bottom',
  classNameFadeOut: 'fade-out',
  classNameFadeIn: 'fade-in',
  classNameBodyNoScroll: 'no-scroll',
  attrDataTarget: 'data-target',

};

export const ModalUI = {

  Config: ModalConfig,

  getAll(container = document) {
    return container.getElementsByTagName(this.Config.tagName) || false;
  },

  getCloser(modal) {
    return modal.getElementsByClassName(this.Config.classNameCloser)[0] || false;
  },

  createBackdrop() {
    return document.createElement(this.Config.tagNameBackdrop);
  },

  wrapBackdropAroundModal(modal) {
    const backdrop = this.createBackdrop();
    backdrop.classList.add(this.Config.classNameFadeIn);
    const parent = modal.parentNode;
    parent.insertBefore(backdrop, modal);
    backdrop.appendChild(modal);
  },

  unwrapBackdropFromModal(modal) {
    const backdrop = modal.parentNode;
    backdrop.classList.add(this.Config.classNameFadeOut);
    backdrop.addEventListener('animationend', () => {
      const parent = backdrop.parentNode;
      parent.insertBefore(modal, backdrop);
      parent.removeChild(backdrop);
    });
  },

  getToggleBtn(modal) {
    const id = modal.id;
    if (id) {
      return document.querySelector('[data-target="' + id + '"]') || false;
    }
    return false;
  },

  show(modal, prevFocusedElement) {
    modal.setAttribute('tabindex', 0);
    modal.__prev_focused = prevFocusedElement;
    document.body.classList.add(this.Config.classNameBodyNoScroll);
    modal.classList.add(this.Config.classNameShow);
    modal.classList.add(this.Config.classNameSlideIn);
    this.wrapBackdropAroundModal(modal);
    setTimeout(() => {
      modal.focus();
    }, 0);
  },

  hide(modal) {
    modal.removeAttribute('tabindex');
    modal.__prev_focused.focus();
    delete modal.__prev_focused;
    modal.classList.add(this.Config.classNameSlideOut);
    this.unwrapBackdropFromModal(modal);
    const handler = () => {
      modal.classList.remove(this.Config.classNameShow);
      modal.classList.remove(this.Config.classNameSlideIn);
      modal.classList.remove(this.Config.classNameSlideOut);
      document.body.classList.remove(this.Config.classNameBodyNoScroll);
      modal.removeEventListener('animationend', handler);
    };
    modal.addEventListener('animationend', handler);
  }

};

export const Modal = {

  Config: ModalConfig,
  UI: ModalUI,

  init(modal) {
    this.addEvents(modal);
  },

  initAll(container = document) {
    [].forEach.call(this.UI.getAll(container), modal => {
      this.init(modal);
    });
  },

  addEvents(modal) {
    const btn = this.UI.getToggleBtn(modal);
    if (btn) {
      modal.__click_toggler = addEvent(btn, 'click', this.handlerShow.bind(this, modal));
    }
  },

  handlerShow(modal, e) {
    const btn = this.UI.getToggleBtn(modal);
    if (btn) {
      removeEvent(btn, 'click', modal.__click_toggler);
      delete modal.__click_toggler;
    }

    const closer = this.UI.getCloser(modal);
    if (closer) {
      modal.__click_closer = addEvent(closer, 'click', this.handlerHide.bind(this, modal));
    }

    this.UI.show(modal, e.target);

    setTimeout(() => {
      modal.__click_outside = onClickOutside(modal, this.handlerHide.bind(this, modal));
    }, 100);

    if (modal.__on_show !== undefined) modal.__on_show.forEach(cb => cb());
  },

  handlerHide(modal) {
    const btn = this.UI.getToggleBtn(modal);
    if (btn) {
      modal.__click_toggler = addEvent(btn, 'click', this.handlerShow.bind(this, modal));
    }

    const closer = this.UI.getCloser(modal);
    if (closer) {
      removeEvent(closer, 'click', modal.__click_closer);
      delete modal.__click_closer;
    }

    this.UI.hide(modal);

    removeClickOutside(modal, modal.__click_outside);
    delete modal.__click_outside;

    if (modal.__on_hide !== undefined) modal.__on_hide.forEach(cb => cb());
  },

  show(modal) {
    this.handlerShow(modal, {target: document.activeElement});
  },

  hide(modal) {
    this.handlerHide(modal);
  },

  onShow(modal, callback) {
    if (modal.__on_show === undefined) modal.__on_show = [];
    modal.__on_show.push(callback);
  },

  onHide(modal, callback) {
    if (modal.__on_hide === undefined) modal.__on_hide = [];
    modal.__on_hide.push(callback);
  },

};

document.addEventListener('DOMContentLoaded', () => {
  Modal.initAll();
});
