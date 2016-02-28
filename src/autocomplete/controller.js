
import { Autocomplete } from '../bunny.autocomplete';
import { Ajax } from '../bunny.ajax';

export var AutocompleteController = {

    inputDelay(handler, ms) {
        var timer = 0;
        (function() {
            clearTimeout(timer);
            timer = setTimeout(handler, ms);
        })();
    },

    attachInputTypeEvent(container_id, data_handler = JSON.parse, ajax_headers = {}) {
        var ac = Autocomplete.get(container_id);
        var timer = 0;
        ac._picked = false;
        ac.input.addEventListener('input', function() {
            var input = this;
            clearTimeout(timer);
            if (input.value.length >= ac.options.minCharLimit) {
                timer = setTimeout(function() {
                    var ajax_url = ac.ajaxUrl.replace('{search}', encodeURI(input.value));
                    Ajax.get(ajax_url, function(data) {
                        var $data = data_handler(data);
                        if ($data.length !== 0) {
                            Autocomplete.setItems(container_id, $data);
                            Autocomplete.show(container_id);
                        } else {
                            Autocomplete.hide(container_id);
                        }
                    }, function(response_text, status_code) {
                        if (ac.options.ajaxErrorHandler !== null) {
                            ac.options.ajaxErrorHandler(response_text, status_code);
                        }
                        Autocomplete.hide(container_id);
                    }, ajax_headers);
                }, ac.options.inputDelay);
            }

        });
    },

    attachInputFocusEvent(container_id) {
        var ac = Autocomplete.get(container_id);
        ac.input.addEventListener('focus', function(e) {
            ac._valueOnFocus = this.value;
        });
    },

    attachInputOutEvent(container_id) {
        var ac = Autocomplete.get(container_id);
        ac.input.addEventListener('blur', function(e) {
            var input = this;
            setTimeout(function(){
                if (!ac._picked) {
                    // if item was not picked from list
                    if (ac.options.allowCustomInput) {
                        // custom input allowed, keep input value as is
                        // if there is hidden input set it to options default value (empty)
                        if (ac.hiddenInput !== null) {
                            ac.hiddenInput.value = ac.options.defaultCustomHiddenInputValue;
                        }
                    } else {
                        // custom input not allowed, restore default
                        if (ac._valueOnFocus !== input.value) {
                            // restore default only if value changed
                            Autocomplete.restoreDefaultValue(container_id);
                        }
                    }
                }
                ac._picked = false;
                Autocomplete.hide(container_id);
            }, 100);
        });
    },

    attachItemSelectEvent(container_id) {
        var ac = Autocomplete.get(container_id);
        for (var k = 0; k < ac.dropdownItems.length; k++) {
            ac.dropdownItems[k].addEventListener('click', function() {
                var attr_val = this.getAttribute('value');
                if (attr_val === null) {
                    attr_val = this.innerHTML;
                }
                ac._picked = true;
                Autocomplete.hide(container_id);
                ac.input.value = this.innerHTML;
                if (ac.hiddenInput !== null) {
                    ac.hiddenInput.value = attr_val;
                }
                for (var i = 0; i < ac.itemSelectHandlers.length; i++) {
                    ac.itemSelectHandlers[i](attr_val, this.innerHTML);
                }
            });
        }
    }

};
