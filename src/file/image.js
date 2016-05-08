
import { BunnyFile } from './file';

/**
 * @component BunnyImage
 * Wrapper for Image object representing <img> tag, uses Canvas and BunnyFile
 *
 */
export const BunnyImage = {

    // SECTION: get Image object via different sources

    /**
     * Downloads image by any URL, should work also for non-CORS domains
     *
     * @param {String} URL
     * @returns {Promise} success(Image object), fail(error)
     */
    getImageByURL(URL) {
        const img = new Image;
        const p = new Promise((resolve, reject) => {
            img.onload = () => {
                resolve(img);
            };
            img.onerror = (e) => {
                reject(e);
            }
        });
        img.crossOrigin = 'Anonymous';
        img.src = URL;
        return p;
    },

    blobToImage(blob) {
        const img = new Image;
        img.src = BunnyFile.getBlobLocalURL(blob);
        return img;
    },

    base64ToImage(base64) {
        const img = new Image;
        img.src = base64;
        return img;
    },

    canvasToImage(canvas) {
        var img = new Image;
        img.src = canvas.toDataURL();
        return img;
    },




    // SECTION:: create different sources from Image object

    imageToCanvas(img, width = null, height = null) {
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
        return this.imageToCanvas(img, width, height).toDataURL();
    },

    imageToBlob(img) {
        return BunnyFile.base64ToBlob(this.imageToBase64(img));
    },




    // SECTION: basic Image statistics and info functions

    getImageURL(img) {
        return img.src;
    },

    getImageWidth(img) {
        return img.width;
    },

    getImageHeight(img) {
        return img.height;
    },




    // SECTION: basic Image data math functions

    getImageNewAspectSizes(img, max_width, max_height) {
        let width = img.width;
        let height = img.height;
        if (width > height) {
            if (width > max_width) {
                height *= max_width / width;
                width = max_width;
            }
        } else {
            if (height > max_height) {
                width *= max_height / height;
                height = max_height;
            }
        }

        return {
            width: width,
            height: height
        }
    },





    // SECTION: basic Image manipulation

    /**
     * Resize image
     * @param {Image} img
     * @param {Number} max_width
     * @param {Number} max_height
     * @returns {Image}
     */
    resizeImage(img, max_width, max_height) {
        const sizes = this.getImageNewAspectSizes(img, max_width, max_height);
        const width = sizes.width;
        const height = sizes.height;
        const canvas = this.imageToCanvas(img, width, height);
        return this.canvasToImage(canvas);
    }

};
