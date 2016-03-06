
export var FileUpload = {

    download: function(url, callback, error_callback = null) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    var blob = this.response;
                    callback(blob);
                } else {
                    if (error_callback !== null) {
                        error_callback(this.response, this.status);
                    }
                }
            }
        };
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.send();

    },

    addToForm: function(form_id_or_el, input_name, blob) {
        if (typeof form_id_or_el === 'object') {
            var el = form_id_or_el;
        } else {
            var el = document.getElementById(form_id_or_el);
        }

        var post_data = new FormData(el);
        post_data.append(input_name, blob);
        return post_data;
    },

    previewImageFromInput(preview_img_id_or_el, file_input_id_or_el) {
        if (typeof preview_img_id_or_el === 'object') {
            var el = preview_img_id_or_el;
        } else {
            var el = document.getElementById(preview_img_id_or_el);
        }

        if (typeof file_input_id_or_el === 'object') {
            var input = file_input_id_or_el;
        } else {
            var input = document.getElementById(file_input_id_or_el);
        }

        el.src = URL.createObjectURL(input.files[0]);
    },

    previewImageFromBlob(preview_img_id_or_el, blob) {
        if (typeof preview_img_id_or_el === 'object') {
            var el = preview_img_id_or_el;
        } else {
            var el = document.getElementById(preview_img_id_or_el);
        }
        el.src = URL.createObjectURL(blob);
    },

    attachImagePreviewEvent(preview_img_id_or_el, file_input_id_or_el) {
        if (typeof preview_img_id_or_el === 'object') {
            var el = preview_img_id_or_el;
        } else {
            var el = document.getElementById(preview_img_id_or_el);
        }

        if (typeof file_input_id_or_el === 'object') {
            var input = file_input_id_or_el;
        } else {
            var input = document.getElementById(file_input_id_or_el);
        }

        input.addEventListener('change', () => {
            this.previewImageFromInput(el, input);
        });
    }

};
