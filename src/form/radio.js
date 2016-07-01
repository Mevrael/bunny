
export var Radio = {
    create(radio_container_id, custom_radio_class, checked_class) {
        var container = null;
        if (radio_container_id === null) {
            container = document;
        } else {
            container = document.getElementById(radio_container_id);
        }
        var custom_radios = container.getElementsByClassName(custom_radio_class);
        var inputs = container.getElementsByTagName('input');

        var checked_input_index = null;

        for (let k = 0; k < inputs.length; k++) {
            // set currently checked input index
            if (inputs[k].checked) {
                checked_input_index = k;
                break;
            }
        }
        if (checked_input_index === null) {
            checked_input_index = 0;
        }

        // if input is checked by default but don't have checked_class, add it
        if (!custom_radios[checked_input_index].classList.contains(checked_class)) {
            custom_radios[checked_input_index].classList.add(checked_class);
        }

        for (let k = 0; k < inputs.length; k++) {
            inputs[k].addEventListener('change', () => {
                custom_radios[checked_input_index].classList.remove(checked_class);
                checked_input_index = k;
                custom_radios[k].classList.add(checked_class);
            });
        }
    }
};
