
document.getElementsByClassName('dropdown').forEach((dropdown) => {

    const toggle_btn = dropdown.getElementsByClassName('dropdown-toggle')[0];

    if (toggle_btn !== undefined) {

        if (toggle_btn.getAttribute('data-close-inside') === 'false') {
            const dropdown_menu = dropdown.getElementsByClassName('dropdown-menu')[0];
            dropdown_menu.addEventListener('click', (e) => {
                e.stopPropagation();
            })
        }

        const close_event = new CustomEvent('close');
        const open_event = new CustomEvent('open');

        const body_handler = () => {
            if (dropdown.classList.contains('open')) {
                dropdown.classList.remove('open');
                document.body.removeEventListener('click', body_handler);
                toggle_btn.dispatchEvent(close_event);
            }
        };

        toggle_btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!dropdown.classList.contains('open')) {
                dropdown.classList.add('open');
                document.body.addEventListener('click', body_handler);
                toggle_btn.dispatchEvent(open_event);
            } else {
                dropdown.classList.remove('open');
                toggle_btn.dispatchEvent(close_event);
            }
        });

        toggle_btn.close = function() {
            dropdown.classList.remove('open');
            document.body.removeEventListener('click', body_handler);
            toggle_btn.dispatchEvent(close_event);
        };

        toggle_btn.open = function() {
            dropdown.classList.add('open');
            document.body.addEventListener('click', body_handler);
            toggle_btn.dispatchEvent(open_event);
        };

        toggle_btn.toggle = function() {
            if (!dropdown.classList.contains('open')) {
                dropdown.classList.add('open');
                document.body.addEventListener('click', body_handler);
                toggle_btn.dispatchEvent(open_event);
            } else {
                dropdown.classList.remove('open');
                toggle_btn.dispatchEvent(close_event);
            }
        };

    }

});
