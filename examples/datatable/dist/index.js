/*import { Template } from '../../src/bunny.template';*/

Template.define('users_row_template', {
    edit: function edit(btn, user) {
        btn.href += user.index;
    },
    remove: function remove(btn, user) {
        btn.href += user.index;
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            // show custom confirm popup
            // in this example we will just call native confirm()
            if (confirm('Are you sure?')) {
                window.location = btn.href;
            }
        });
    }
}, {
    format_data: function format_data(data) {
        data.name = data.name.first + ' ' + data.name.last;
        return data;
    }
});

DataTable.onRedraw(document.getElementsByTagName('datatable')[0], function (data) {
    console.info('Switched to page ' + data.current_page);
    console.info('First user name is:' + data.data[0].name);
});
