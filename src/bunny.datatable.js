
import { Ajax } from './bunny.ajax';
import { Template } from './bunny.template';
import { Paginator } from './bunny.paginator';

export var DataTable = {

    _tables: [],
    _paginationLimit: 7,

    define: function(table_id, row_tpl_id, row_handlers = {}, row_events = {}) {

        var e = document.getElementById(table_id);

        if (e === null) {
            console.error('DataTable with id="'+table_id+'" doesn\'t exists');
            return false;
        } else if (e.tagName !== 'TABLE') {
            console.error('DataTable with id="'+table_id+'" is not an HTML table');
            return false;
        }

        var pagination_id = table_id + '_pagination';

        var p = document.getElementById(pagination_id);

        if (p === null) {
            console.error('Pagination with id="' + pagination_id + '" doesn\'t exists');
            return false;
        }

        var stats_id = table_id + '_stats';

        var s = document.getElementById(stats_id); // can be null

        Template.define(row_tpl_id, row_handlers, row_events);

        this._tables[table_id] = {
            table: e,
            pagination: p,
            stats: s,
            row_tpl_id: row_tpl_id,
            handlers: []
        };

        this.addBtnListeners(table_id);
    },

    addBtnListeners: function(table_id) {
        var self = this;
        var pagination = this._tables[table_id].pagination;
        pagination.querySelectorAll('.page-link').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var url = btn.getAttribute('href');
                self.changePage(table_id, url);
            })
        });
    },

    changePage: function(table_id, url) {

        var row_tpl_id = this._tables[table_id].row_tpl_id;
        var table = this._tables[table_id].table;
        var self = this;

        Ajax.get(url, function($data) {
            var data = JSON.parse($data);

            // delete current rows
            var row_count = table.rows.length;
            for (var i = row_count - 1; i > 0; i--) {
                table.deleteRow(i);
            }

            // insert new rows
            Template.insertAll(row_tpl_id, data.data, table);

            // update footer stats

            // update pagination
            self.updatePagination(table_id, data);

            // call redraw
            self._tables[table_id].handlers.forEach(function(handler) {
                handler(table);
            });

        });

    },

    updatePagination: function(table_id, data) {
        var p = Paginator.create(table_id, data, this._paginationLimit);
        p.redraw();
        p.updateStats();
        this.addBtnListeners(table_id);
    },

    onRedraw: function(table_id, callback) {
        this._tables[table_id].handlers.push(callback);
    }

};
