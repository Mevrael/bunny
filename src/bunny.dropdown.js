
document.getElementsByClassName('dropdown').forEach((dropdown) => {

    let toggle_btn = dropdown.getElementsByClassName('dropdown-toggle')[0];

    if (toggle_btn !== undefined) {
        
        if (toggle_btn.getAttribute('data-close-inside') === 'false') {
            let dropdown_menu = dropdown.getElementsByClassName('dropdown-menu')[0];
            dropdown_menu.addEventListener('click', (e) => {
                e.stopPropagation();
            })
        }

        let body_handler = () => {
            if (dropdown.classList.contains('open')) {
                dropdown.classList.remove('open');
                document.body.removeEventListener('click', body_handler);
            }
        };

        toggle_btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!dropdown.classList.contains('open')) {
                dropdown.classList.add('open');
                document.body.addEventListener('click', body_handler);
            } else {
                dropdown.classList.remove('open');
            }
        });

    }

});
