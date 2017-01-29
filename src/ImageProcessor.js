
import { addEvent, removeEvent } from './utils/DOM';
import { BunnyImage } from './file/image';

export const ImageProcessorConfig = {
  tagName: 'imageprocessor',
  tagNameCursor: 'imagecursor',
  selectorBtnSave: '[pid="save"]',
  selectorBtnRotate: '[pid="rotate"]',
  attrQuality: 'quality',
  defaultQuality: 0.7,
  attrOutputSize: 'outputsize',
  defaultOutputSize: '300',
};

export const ImageProcessorUI = {

  Config: ImageProcessorConfig,

  getAll(container = document) {
    return container.getElementsByTagName(this.Config.tagName);
  },

  getImage(processor) {
    if (processor.__img === undefined) {
      processor.__img = processor.getElementsByTagName('img')[0] || false;
    }
    return processor.__img;
  },

  getCursor(processor) {
    if (processor.__cursor === undefined) {
      processor.__cursor = processor.getElementsByTagName(this.Config.tagNameCursor)[0] || false;
    }
    return processor.__cursor;
  },

  getSaveBtn(processor) {
    return processor.querySelector(this.Config.selectorBtnSave) || false;
  },

  getRotateBtn(processor) {
    return processor.querySelector(this.Config.selectorBtnSave) || false;
  },

  checkCursorWillBeInsideX(processor, newX) {
    const cursor = this.getCursor(processor);
    const img = this.getImage(processor);
    return newX >= 0 && cursor.getBoundingClientRect().width + newX <= img.getBoundingClientRect().width;
  },

  checkCursorWillBeInsideY(processor, newY) {
    const cursor = this.getCursor(processor);
    const img = this.getImage(processor);
    return newY >= 0 && cursor.getBoundingClientRect().height + newY <= img.getBoundingClientRect().height;
  },

  /**
   * Automatically center a cursor taking full images's smallest side length
   */
  centerCursor(processor) {
    const img = this.getImage(processor);
    const cursor = this.getCursor(processor);
    let size = 0;
    const imgrect = img.getBoundingClientRect();
    if (imgrect.width > imgrect.height) {
      size = imgrect.height;
      cursor.style.left = (imgrect.width - size) / 2 + 'px';
      cursor.style.top = 0 + 'px';
    } else {
      size = imgrect.width;
      cursor.style.left = 0 + 'px';
      cursor.style.top = (imgrect.height - size) / 2 + 'px';
    }
    cursor.style.width = size + 'px';
    cursor.style.height = size + 'px';
  },

  moveCursor(processor, deltaX, deltaY) {
    const img = this.getImage(processor);
    const cursor = this.getCursor(processor);
    const imgrect = img.getBoundingClientRect();
    const cursorrect = cursor.getBoundingClientRect();

    if (this.checkCursorWillBeInsideX(processor, cursor.offsetLeft + deltaX)) {
      cursor.style.left = cursor.offsetLeft + deltaX + 'px';
    } else if (cursor.offsetLeft + deltaX < 0) {
      cursor.style.left = '0px';
    } else {
      cursor.style.left = imgrect.width - cursorrect.width;
    }

    if (this.checkCursorWillBeInsideY(processor, cursor.offsetTop + deltaY)) {
      cursor.style.top = cursor.offsetTop + deltaY + 'px';
    } else if (cursor.offsetTop + deltaY < 0) {
      cursor.style.top = '0px';
    } else {
      cursor.style.top = imgrect.height - cursorrect.height;
    }
  },

  resizeCursor(processor, deltaX, deltaY = null) {
    const img = this.getImage(processor);
    const cursor = this.getCursor(processor);
    const imgrect = img.getBoundingClientRect();
    const cursorrect = cursor.getBoundingClientRect();

    let width = cursorrect.width + deltaX;
    let height = 0;
    if (deltaY === null) {
      height = cursorrect.height + deltaX;
    } else {
      height = cursorrect.height + deltaY;
    }

    if (cursor.offsetTop + height <= imgrect.height &&
      cursor.offsetLeft + width <= imgrect.width) {
      cursor.style.width = width + 'px';
      cursor.style.height = height + 'px';
      return true;
    }
    return false;
  },

};

export const ImageProcessor = {

  Config: ImageProcessorConfig,
  UI: ImageProcessorUI,

  init(processor, src = null, onSave = null) {
    if (src !== null) {
      this.setImage(processor, src);
    }

    this.addEvents(processor);

    if (onSave !== null) {
      this.onSave(processor, onSave);
    }
  },

  deinit(processor) {
    this.removeEvents(processor);
    delete processor.__on_save;
  },

  initAll(container = document) {
    [].forEach.call(this.UI.getAll(container), processor => {
      this.init(processor);
    });
  },

  deinitAll(container = document) {
    [].forEach.call(this.UI.getAll(container), processor => {
      this.deinit(processor);
    });
  },

  addEvents(processor) {
    const cursor = this.UI.getCursor(processor);
    const img = this.UI.getImage(processor);
    const saveBtn = this.UI.getSaveBtn(processor);
    processor.__move_start = addEvent(cursor, 'mousedown', this.handleBeginMove.bind(this, processor));
    processor.__move_end = addEvent(window, 'mouseup', this.handleEndMove.bind(this, processor));
    processor.__zoom = addEvent(processor, 'wheel', this.handleZoom.bind(this, processor));
    processor.__save = addEvent(saveBtn, 'click', this.handleSave.bind(this, processor));
    processor.__img_load = addEvent(img, 'load', this.handleImgLoad.bind(this, processor));
    processor.__keypress = addEvent(cursor, 'keypress', this.handleKeyPress.bind(this, processor));
  },

  removeEvents(processor) {
    const cursor = this.UI.getCursor(processor);
    const img = this.UI.getImage(processor);
    const saveBtn = this.UI.getSaveBtn(processor);
    delete removeEvent(cursor, 'mousedown', processor.__move_start);
    delete removeEvent(window, 'mouseup', processor.__move_end);
    delete removeEvent(processor, 'wheel', processor.__zoom);
    delete removeEvent(saveBtn, 'click', processor.__save);
    delete removeEvent(img, 'load', processor.__img_load);
    delete removeEvent(cursor, 'keypress', processor.__keypress);
  },

  handleKeyPress(processor, e) {
    e.preventDefault();
    if (processor.__key_speed === undefined) {
      processor.__key_speed = 0;
    }
    processor.__key_speed++;
    if (processor.__key_timeout !== undefined) {
      clearTimeout(processor.__key_timeout);
    }
    processor.__key_timeout = setTimeout(() => {
      delete processor.__key_speed;
      delete processor.__key_timeout;
    }, 100);

    if (e.keyCode === KEY_ARROW_RIGHT) {
      if (e.shiftKey) {
        this.UI.resizeCursor(processor, processor.__key_speed);
      } else {
        this.UI.moveCursor(processor, processor.__key_speed, 0);
      }
    } else if (e.keyCode === KEY_ARROW_DOWN) {
      if (e.shiftKey) {
        this.UI.resizeCursor(processor, -processor.__key_speed);
      } else {
        this.UI.moveCursor(processor, 0, processor.__key_speed);
      }
    } else if (e.keyCode === KEY_ARROW_LEFT) {
      if (e.shiftKey) {
        this.UI.resizeCursor(processor, -processor.__key_speed);
      } else {
        this.UI.moveCursor(processor, -processor.__key_speed, 0);
      }
    } else if (e.keyCode === KEY_ARROW_UP) {
      if (e.shiftKey) {
        this.UI.resizeCursor(processor, processor.__key_speed);
      } else {
        this.UI.moveCursor(processor, 0, -processor.__key_speed);
      }
    } else if (e.keyCode === KEY_ENTER) {
      this.handleSave(processor);
    }
  },

  /**
   *
   * @param processor
   * @param {String|File|Blob} src
   */
  setImage(processor, src) {
    if (typeof src !== 'string') {
      src = URL.createObjectURL(src);
    }
    this.UI.getImage(processor).src = src;
  },

  setQuality(processor, quality) {
    processor.setAttribute(this.Config.attrQuality, quality);
  },

  getQuality(processor) {
    let q = processor.getAttribute(this.Config.attrQuality);
    if (q) {
      q = parseFloat(q);
    } else {
      q = this.Config.defaultQuality;
    }
    return q;
  },

  setOutputSize(processor, size) {
    processor.setAttribute(this.Config.attrOutputSize, size);
  },

  getOutputSize(processor) {
    let s = processor.getAttribute(this.Config.attrOutputSize);
    if (s) {
      s = parseFloat(s);
    } else {
      s = this.Config.defaultOutputSize;
    }
    return s;
  },

  handleZoom(processor, e) {
    e.preventDefault();
    const deltaX = -e.deltaY * 2;
    this.UI.resizeCursor(processor, deltaX);
  },

  handleImgLoad(processor) {
    this.UI.centerCursor(processor);
    this.UI.getCursor(processor).focus();
  },

  setMoveStartPos(processor, e) {
    processor.__startX = e.layerX;
    processor.__startY = e.layerY;
  },

  getMoveStartPos(processor) {
    return [
      processor.__startX,
      processor.__startY
    ];
  },

  handleMove(processor, e) {
    const startPos = this.getMoveStartPos(processor);
    const endX = e.layerX;
    const endY = e.layerY;
    const deltaX = endX - startPos[0];
    const deltaY = endY - startPos[1];
    this.UI.moveCursor(processor, deltaX, deltaY);
  },

  handleBeginMove(processor, e) {
    const cursor = this.UI.getCursor(processor);
    cursor.focus();
    cursor.classList.add('moving');
    this.setMoveStartPos(processor, e);
    processor.__moving = addEvent(cursor, 'mousemove', this.handleMove.bind(this, processor));
  },

  handleEndMove(processor, e) {
    const cursor = this.UI.getCursor(processor);
    cursor.classList.remove('moving');
    delete removeEvent(cursor, 'mousemove', processor.__moving);
  },


  /**
   * Process an image - crops by selected region, resize to $size x $size
   * makes an image/jpeg with $quality
   * and returns a base64 string can be used in src attribute or for further custom file processing
   *
   * @param processor
   * @param size
   * @param quality
   * @returns {string}
   */
  processImage(processor, size, quality) {
    let canv = BunnyImage.cropByCursor(this.UI.getImage(processor), this.UI.getCursor(processor));
    canv = BunnyImage.resizeCanvas(canv, size);
    const base64 = canv.toDataURL('image/jpeg', quality);
    return base64;
  },

  handleSave(processor) {
    const size = this.getOutputSize(processor);
    const quality = this.getQuality(processor);
    const src = this.processImage(processor, size, quality);
    if (processor.__on_save !== undefined) {
      processor.__on_save.forEach(cb => {
        cb(src);
      });
    }
  },

  onSave(processor, callback) {
    if (processor.__on_save === undefined) processor.__on_save = [];
    processor.__on_save.push(callback);
  },

};
