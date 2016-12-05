
import {getSvgIcon, createSvgUse, changeSvgIcon} from "./utils/svg";

/**
 * SVG Spinner Component
 *
 * Creates inline <svg class="{className}"><use xlink:href="#{icon}"></svg>
 * and appends it to any 'element'
 *
 * Use Spinner.toggle(element) to add/remove spinner
 *
 * If `element` itself is an inline <svg>,
 *   then saves original icon ID
 *   and changes only xlink:href attribute
 *   instead of creating and appending new one <svg>
 *   Useful, for example, when search icon temporary could be replaced with spinner
 */

export const SpinnerConfig = {

  icon: 'spinner',
  className: 'i-spinner', // class name with rotate animation since SVG SMIL is deprecated and is not working in IE/Edge

  tagNameFade: 'fade',
  classNameFade: null,
  classNameFadeShow: 'show',
  animationDuration: 600

};

export const Spinner = {

  Config: SpinnerConfig,

  insertSpinner(element, spinner) {
    element.appendChild(spinner);
  },

  removeSpinner(element, spinner) {
    element.removeChild(spinner);
  },

  getSpinner(element) {
    return element.__bunny_spinner || false;
  },

  has(element) {
    return element.__bunny_spinner !== undefined;
  },

  show(element, removeText = false) {
    if (element.tagName === 'SVG' || element.tagName === 'svg') {
      element.__bunny_spinner = getSvgIcon(element);
      changeSvgIcon(element, this.Config.icon);
      element.classList.add(this.Config.className);
    } else {
      if (removeText) {
        element.__bunny_spinner_text = element.innerHTML;
        element.textContent = '';
      }
      element.__bunny_spinner = createSvgUse(this.Config.icon, {class: this.Config.className});
      this.insertSpinner(element, element.__bunny_spinner);
    }
  },

  hide(element, removeText = false) {
    if (element.tagName === 'SVG' || element.tagName === 'svg') {
      element.classList.remove(this.Config.className);
      changeSvgIcon(element, element.__bunny_spinner);
    } else {
      this.removeSpinner(element, element.__bunny_spinner);
      if (removeText) {
        element.innerHTML = element.__bunny_spinner_text;
        delete element.__bunny_spinner_text;
      }
    }
    delete element.__bunny_spinner;
  },

  toggle(element, removeText = false) {
    if (this.has(element)) {
      this.hide(element, removeText);
      return true;
    } else {
      this.show(element, removeText);
      return false;
    }
  },

  fadePage(text = null, textClass = null) {
    return new Promise(resolve => {
      const fade = this.getFade();
      if (!fade) {
        const el = document.createElement(this.Config.tagNameFade);
        if (this.Config.classNameFade !== null) {
          el.classList.add(this.Config.classNameFade);
        }
        const textNode = document.createElement('div');
        textNode.classList.add('fade');
        if (textClass) {
          textNode.classList.add(textClass);
        }
        el.appendChild(textNode);
        document.body.appendChild(el);
        setTimeout(() => {
          if (text !== null) {
            textNode.textContent = text;
            textNode.classList.add('in');
          }
          this.toggle(el);
          el.classList.add(this.Config.classNameFadeShow);
          setTimeout(() => {
            resolve();
          }, this.Config.animationDuration);
        }, 0);
      } else {
        resolve();
      }
    });
  },

  getFade() {
    return document.getElementsByTagName(this.Config.tagNameFade)[0] || false;
  },

  getFadeIcon() {
    return this.getSpinner(this.getFade());
  },

  getFadeText() {
    return this.getFade().getElementsByTagName('div')[0];
  },

  unfadePage() {
    return new Promise(resolve => {
      const fade = this.getFade();
      if (fade) {
        fade.classList.remove(this.Config.classNameFadeShow);
        setTimeout(() => {
          document.body.removeChild(fade);
          resolve();
        }, this.Config.animationDuration);
      } else {
        resolve();
      }
    });
  },

  setFadeIcon(newIconId, className = null) {
    const spinner = this.getFadeIcon();
    spinner.classList.remove(this.Config.className);
    changeSvgIcon(spinner, newIconId);
    if (className) {
      spinner.classList.add(className);
    }
  },

  setFadeText(newText, newClassAttribute = null) {
    const text = this.getFadeText();
    text.classList.remove('in');
    setTimeout(() => {
      text.textContent = newText;
      if (newClassAttribute) {
        text.setAttribute('class', newClassAttribute);
      }
      text.classList.add('in');
    }, 300);
  }

};
