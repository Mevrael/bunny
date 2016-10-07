
export const BunnyFile = {

    /**
     * Download file from URL via AJAX and make Blob object or return base64 string if 2nd argument is false
     * Only files from CORS-enabled domains can be downloaded or AJAX will get security error
     *
     * @param {String} URL
     * @param {Boolean} convert_to_blob = true
     * @returns {Promise}: success(Blob object | base64 string), fail(response XHR object)
     */
    download(URL, convert_to_blob = true) {
        var request = new XMLHttpRequest();
        const p = new Promise( (success, fail) => {
            request.onload = () => {
                if (request.status === 200) {
                    const blob = request.response;
                    success(blob);
                } else {
                    fail(request);
                }
            };
        });

        request.open('GET', URL, true);
        if (convert_to_blob) {
            request.responseType = 'blob';
        }
        request.send();

        return p;
    },

    /**
     * Get File/Blob header (signature) to parse for MIME-type or any magic numbers
     * @param {File|Blob} blob
     * @returns {Promise} callback(str:signature)
     */
    getSignature(blob) {
        return new Promise(callback => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const arr = (new Uint8Array(reader.result)).subarray(0, 4);
                let signature = '';
                for (let i = 0; i < arr.length; i++) {
                    signature += arr[i].toString(16);
                }
                callback(signature);
            };
            reader.readAsArrayBuffer(blob);
        });
    },

    /**
     * Check if string is a valid signature for image/jpeg
     * @param {String} signature
     * @returns {boolean}
     */
    isJpeg(signature) {
        const signatures = ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2'];
        return signatures.indexOf(signature) > -1;
    },

    /**
     * Check if string is a valid signature for image/png
     * @param {String} signature
     * @returns {boolean}
     */
    isPng(signature) {
        return signature === '89504e47';
    },

    /**
     * Convert base64 string to Blob object
     * @param {String} base64
     * @returns {Blob}
     */
    base64ToBlob(base64) {
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        var byteString = atob(base64.split(',')[1]);

        // separate out the mime component
        var mimeString = base64.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        return new Blob([ab], {type: mimeString});
    },

    /**
     * Convert Blob object to base64string
     * @param {Blob} blob
     * @returns {Promise} success(base64 string), fail(error)
     */
    blobToBase64(blob) {
        const reader = new FileReader;
        const p = new Promise( (success, fail) => {
            reader.onloadend = () => {
                let base64 = reader.result;
                success(base64);
            };
            reader.onerror = (e) => {
                fail(e);
            }
        });

        reader.readAsDataURL(blob);

        return p;
    },

    /**
     * Get local browser object URL which can be used in img.src for example
     * @param {Blob} blob
     * @returns {String}
     */
    getBlobLocalURL(blob) {
        if (!(blob instanceof Blob || blob instanceof File)) {
            throw new TypeError('Argument in BunnyFile.getBlobLocalURL() is not a Blob or File object');
        }
        return URL.createObjectURL(blob);
    }

};
