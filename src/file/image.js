
import { BunnyFile } from './file';

/**
 * @component BunnyImage
 * Wrapper for Image object representing <img> tag, uses Canvas and BunnyFile
 *
 */
export const BunnyImage = {

    IMG_CONVERT_TYPE: 'image/jpeg',
    IMG_QUALITY: 0.7,

    // SECTION: get Image object via different sources

    /**
     * Downloads image by any URL or converts from Blob, should work also for non-CORS domains
     *
     * @param {String|Blob} urlOrBlob
     * @returns {Promise} success(Image object), fail(error)
     */
    getImage(urlOrBlob) {
        if (typeof urlOrBlob === 'string') {
            return this.getImageByURL(urlOrBlob);
        } else {
            return this.getImageByBlob(urlOrBlob);
        }
    },

    /**
     * Downloads image by any URL, should work also for non-CORS domains
     *
     * @param {String} URL
     * @returns {Promise} success(Image object), fail(error)
     */
    getImageByURL(URL) {
        return this._toImagePromise(URL, true);
    },

    _toImagePromise(src, crossOrigin = false) {
        const img = new Image;
        const p = new Promise( (ok, fail) => {
            img.onload = () => {
                ok(img);
            };
            img.onerror = (e) => {
                fail(e);
            }
        });
        if (crossOrigin) {
            img.crossOrigin = 'Anonymous';
        }
        img.src = src;
        return p;
    },

    getImageByBlob(blob) {
        const url = BunnyFile.getBlobLocalURL(blob);
        return this._toImagePromise(url);
    },

    getImageByBase64(base64) {
        const url = base64;
        return this._toImagePromise(url);
    },

    getImageByCanvas(canvas) {
        const url = canvas.toDataURL(this.IMG_CONVERT_TYPE, this.IMG_QUALITY);
        return this._toImagePromise(url);
    },




    // SECTION:: create different sources from Image object

    imageToCanvas(img, width = null, height = null) {
        if (!img.complete) {
            throw new Error('Can not create canvas from Image. Image is not loaded yet.');
        }
        const canvas = document.createElement("canvas");
        if (width === null && height === null) {
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext("2d").drawImage(img, 0, 0);
        } else {
            canvas.width = width;
            canvas.height = height;
            canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        }
        return canvas;
    },

    imageToBase64(img, width = null, height = null) {
        return this.imageToCanvas(img, width, height).toDataURL(this.IMG_CONVERT_TYPE, this.IMG_QUALITY);
    },

    imageToBlob(img) {
        return BunnyFile.base64ToBlob(this.imageToBase64(img));
    },




    // SECTION: basic Image statistics and info functions

    getImageURL(img) {
        return img.src;
    },

    getImageWidth(img) {
        if (!img.complete) {
            throw new Error('Can not get Image.width. Image is not loaded yet.');
        }
        return img.width;
    },

    getImageHeight(img) {
        if (!img.complete) {
            throw new Error('Can not get Image.height. Image is not loaded yet.');
        }
        return img.height;
    },




    // SECTION: basic Image data math functions

    getImageNewAspectSizes(img, max_width, max_height) {
        const img_width = this.getImageWidth(img);
        const img_height = this.getImageHeight(img);
        if (img_width === 0 || img_height === 0) {
            throw new Error('Image width or height is 0 in BunnyImage.getImageNewAspectSizes().')
        }
        const ratio = Math.min(max_width / img_width, max_height / img_height);

        return {
            width: Math.floor(img_width * ratio),
            height: Math.floor(img_height * ratio)
        };
    },





    // SECTION: basic Image manipulation

    /**
     * Resize image
     * @param {Image} img
     * @param {Number} max_width
     * @param {Number} max_height
     * @returns {Promise} success(Image), fail(error)
     */
    resizeImage(img, max_width, max_height) {
        const sizes = this.getImageNewAspectSizes(img, max_width, max_height);
        const width = sizes.width;
        const height = sizes.height;
        const canvas = this.imageToCanvas(img, width, height);
        return this.getImageByCanvas(canvas);
    }

};
