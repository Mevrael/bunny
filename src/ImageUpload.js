
import { BunnyFile } from './file/file';
import { BunnyImage } from "./file/image";
import { Modal } from './Modal';
import { ImageProcessor } from './ImageProcessor';

export const ImageUploadConfig = {

  tagName: 'imageupload',

  attrQuality: 'quality',
  defaultQuality: 0.7,
  attrOutputSize: 'outputsize',
  defaultOutputSize: '300',
  attrFormat: 'format',
  defaultFormat: 'png',

};

export const ImageUpload = {

  Config: ImageUploadConfig,

  init(imgupl) {
    const img = this.getImagePreview(imgupl);
    img._src = img.src;
    this.addEvents(imgupl);
  },

  initAll(container = document) {
    [].forEach.call(this.getAll(container), imgupl => {
      this.init(imgupl);
    });
  },

  addEvents(imgupl) {
    const input = this.getFileInput(imgupl);
    const modal = this.getModal(imgupl);
    const processor = this.getImageProcessor(imgupl);
    const img = this.getImagePreview(imgupl);

    input.addEventListener('change', e => {
      if (modal !== false) {
        Modal.show(modal);
      } else {
        // instant image processing with auto crop/resize
        this.setImage(imgupl, input.files[0]);
      }
    });

    img.addEventListener('click', () => {
      input.click();
    });
    img.addEventListener('keypress', (e) => {
      if (e.keyCode === KEY_ENTER) {
        input.click();
      }
    });

    if (modal !== false) {
      Modal.onShow(modal, () => {
        ImageProcessor.setOutputSize(processor, this.getOutputSize(imgupl));
        ImageProcessor.setQuality(processor, this.getQuality(imgupl));
        ImageProcessor.init(processor, input.files[0], (src) => {
          Modal.hide(modal);
          img.src = src;
          input._file = BunnyFile.base64ToBlob(src);
        });
      });

      Modal.onHide(modal, () => {
        ImageProcessor.deinit(processor);
      });
    }

    // if reset button clicked or form.reset() called from JS - clear custom logic also
    input.form.addEventListener('reset', (e) => {
      img.src = img._src; // restore to default image
      delete input._file;
    });

    if (input.files.length > 0) {
      // after refresh photo is still in the input
      this.setImage(imgupl, input.files[0]);
    }
  },

  getQuality(imgupl) {
    let q = imgupl.getAttribute(this.Config.attrQuality);
    if (q) {
      q = parseFloat(q);
    } else {
      q = this.Config.defaultQuality;
    }
    return q;
  },

  getOutputSize(imgupl) {
    let s = imgupl.getAttribute(this.Config.attrOutputSize);
    if (s) {
      s = parseFloat(s);
    } else {
      s = this.Config.defaultOutputSize;
    }
    return s;
  },

  getFormat(imgupl) {
    let s = imgupl.getAttribute(this.Config.attrFormat);
    if (!s) {
      s = this.Config.defaultFormat;
    }
    return s;
  },

  getAll(container = document) {
    return container.getElementsByTagName(this.Config.tagName);
  },

  getFileInput(imgupl) {
    return imgupl.getElementsByTagName('input')[0] || false;
  },

  getImagePreview(imgupl) {
    return imgupl.getElementsByTagName('img')[0] || false;
  },

  getModal(imgupl) {
    return Modal.UI.getAll(imgupl)[0] || false;
  },

  getImageProcessor(imgupl) {
    return ImageProcessor.UI.getAll(imgupl)[0] || false;
  },


  /**
   * Force, instant custom image set into file input._file property
   * by a base64, URL or Blob
   *
   * @param imgupl
   * @param {String|Blob} src
   */
  setImage(imgupl, src) {
    const input = this.getFileInput(imgupl);
    const img = this.getImagePreview(imgupl);
    const size = this.getOutputSize(imgupl);
    const quality = this.getQuality(imgupl);
    const format = this.getFormat(imgupl);

    BunnyImage.getImage(src)
      .then(img => {
        const canv = BunnyImage.resizeImage(img, size, size);
        return canv.toDataURL('image/' + format, quality);
      })
      .then(base64 => {
        img.src = base64;
        input._file = BunnyFile.base64ToBlob(base64);
        return base64;
      });
  }

};

document.addEventListener('DOMContentLoaded', () => {
  ImageUpload.initAll();
});
