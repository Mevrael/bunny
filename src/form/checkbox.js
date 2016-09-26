
export const Checkbox = {

    create(container_class, custom_checkbox_class, checked_class) {
        document.getElementsByClassName(container_class).forEach((container) => {
            var custom_cb = container.getElementsByClassName(custom_checkbox_class)[0];
            if (custom_cb !== undefined) {
                // container is for custom checkbox, get input
                var input = container.getElementsByTagName('input')[0];

                // if input is checked by default but don't have checked_class, add it
                if (input.checked && !custom_cb.classList.contains(checked_class)) {
                    custom_cb.classList.add(checked_class);
                    //input.value = 1;
                } /*else if (!input.checked) {
                    input.value = 0;
                }*/

                // add handler to toggle checked_class when input is checked/unchecked
                input.addEventListener('change', () => {
                    if (input.checked) {
                        custom_cb.classList.add(checked_class);
                        //input.value = 1;
                    } else {
                        custom_cb.classList.remove(checked_class);
                        //input.value = 0;
                    }
                });
            }
        });
    },

    uncheck(node, container_class, custom_checkbox_class, checked_class) {
        const customCheckboxContainers = node.getElementsByClassName(container_class);
        [].forEach.call(customCheckboxContainers, checkboxContainer => {
            const input = checkboxContainer.getElementsByTagName('input')[0];
            input.checked = false;
            checkboxContainer.classList.remove(checked_class);
            const checkbox = checkboxContainer.getElementsByClassName(custom_checkbox_class)[0];
            checkbox.classList.remove(checked_class);
        })
    }

};
