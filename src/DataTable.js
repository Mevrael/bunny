
import { Ajax } from './bunny.ajax';
import { Template } from './bunny.template';
import { Pagination } from './Pagination';
import { ready } from './utils/DOM';

export const DataTableConfig = {
    ajax: Ajax,
    template: Template,
    pagination: Pagination,

    tagName: 'datatable',
    attrUrl: 'url',
    attrTemplate: 'template',

    tagNamePagination: 'pagination',
    tagNameStats: 'stats',

    perPage: 15,
    paginationLimit: 7,

    ajaxHeaders: []
};

export const DataTable = {

    _config: DataTableConfig,

    _collection: [],

    init(datatable) {
        this._collection.push(datatable);
        this.changePage(datatable, 1);
    },

    getPageUrl(datatable, page) {
        return this._config.pagination.addPageParamToUrl(this.getAjaxUrl(datatable), page);
    },

    getPageData(datatable, url) {
        return new Promise(callback => {
            this._config.ajax.get(url, data => {
                data = JSON.parse(data);
                callback(data);
            }, {}, this.getAjaxHeaders());
        });
    },

    initAll() {
        ready( () => {
            [].forEach.call(document.getElementsByTagName(this._config.tagName), datatable => {
                this.init(datatable);
            })
        });
    },

    isInitiated(datatable) {
        this._collection.forEach(dt => {
            if (dt === datatable) {
                return true;
            }
        });
        return false;
    },

    getTemplateId(datatable) {
        return datatable.getAttribute(this._config.attrTemplate);
    },

    getAjaxUrl(datatable) {
        return datatable.getAttribute(this._config.attrUrl);
    },

    getAjaxHeaders() {
        let headers = {};
        DataTableConfig.ajaxHeaders.forEach(header => {
            const parts = header.split(': ');
            headers[parts[0]] = parts[1];
        });
        return headers;
    },

    getTable(datatable) {
        return datatable.getElementsByTagName('table')[0];
    },

    getPagination(datatable) {
        return datatable.getElementsByTagName(this._config.tagNamePagination)[0];
    },

    getStats(datatable) {
        return datatable.getElementsByTagName(this._config.tagNameStats)[0];
    },

    addAjaxHeader(header) {
        this._config.ajaxHeaders.push(header);
    },

    attachPaginationEventHandlers(datatable) {
        const pg = this.getPagination(datatable);
        this._config.pagination.onItemClick(pg, (page, url) => {
            this.changePage(datatable, page);
        });
    },

    removeRows(datatable) {
        const table = this.getTable(datatable);
        var row_count = table.rows.length;
        for (var i = row_count - 1; i > 0; i--) {
            table.deleteRow(i);
        }
    },

    insertRows(datatable, rows_data) {
        this._config.template.insertAll(this.getTemplateId(datatable), rows_data, this.getTable(datatable));
    },

    callHandlers(datatable, data) {
        if (datatable.callbacks !== undefined) {
            datatable.callbacks.forEach(callback => {
                callback(data);
            })
        }
    },

    changePage(datatable, page) {
        this.getPageData(datatable, this.getPageUrl(datatable, page)).then(data => {
            const pg = this.getPagination(datatable);
            const Pagination = this._config.pagination;
            Pagination.initOrUpdate(pg, data);
            this.attachPaginationEventHandlers(datatable);
            const stats = this.getStats(datatable);
            if (stats !== undefined) {
                stats.textContent = Pagination.getStats(pg);
            }
            this.removeRows(datatable);
            this.insertRows(datatable, data.data);
            this.callHandlers(datatable, data);
        });
    },

    onRedraw(datatable, callback) {
        if (datatable.callbacks === undefined) {
            datatable.callbacks = [];
        }
        datatable.callbacks.push(callback);
    }

};

DataTable.initAll();
