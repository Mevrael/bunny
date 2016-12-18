
//import { Template } from '../../src/bunny.template';
//import { DataTable } from '../../src/DataTable';

Template.define('users_row_template', {
    edit: (btn, user) => {
        btn.href += user.index;
    },
    remove: (btn, user) => {
        btn.href += user.index;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // show custom confirm popup
            // in this example we will just call native confirm()
            if (confirm('Are you sure?')) {
                window.location = btn.href;
            }
        })
    }
});

DataTable.onRedraw(document.getElementsByTagName('datatable')[0], (data) => {
    console.info('Switched to page ' + data.current_page);
    console.info('First user name is:' + data.data[0].name);
});
