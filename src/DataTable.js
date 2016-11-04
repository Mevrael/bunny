
import { Ajax } from './bunny.ajax';
import { Template } from './bunny.template';
import { Pagination } from './Pagination';
import { ready } from './utils/DOM/ready';
import { addEventOnce } from './utils/DOM/events';
import { BunnyURL } from './url';
import { BunnyElement } from './BunnyElement';

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

    loadingImg: '/img/loading.svg',

    ajaxHeaders: []
};

export const DataTable = {

    _config: DataTableConfig,

    _collection: [],

    init(datatable) {
        datatable.__bunny_loadingIcon = this.addLoadingIcon(datatable);
        this._collection.push(datatable);
        let page = BunnyURL.getParam('page');
        if (page === undefined) {
            page = 1;
        }

        this.changePage(datatable, page, this.getSearchDataFromURL(datatable));
        this.addEvents(datatable);
    },

    addEvents(datatable) {
        const searchInput = this.getSearchInput(datatable);
        if (searchInput) {
            addEventOnce(searchInput, 'input', () => {
                this.search(datatable, searchInput.value);
            });
        }
    },

    getSearchInput(datatable, name = 'search') {
        return datatable.querySelector('[name="' + name + '"]') || false;
    },

    getDataUrl(datatable, page, urlParams = {}) {
        let url = this._config.pagination.addPageParamToUrl(this.getAjaxUrl(datatable), page);
        for (let k in urlParams) {
            url += '&' + k + '=' + urlParams[k];
        }
        return url;
    },

    fetchData(datatable, url) {
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

    changePage(datatable, page, data = null) {
        if (data === null) {
            data = this.getSearchData(datatable);
        }
        this.update(datatable, this.getDataUrl(datatable, page, data));
    },

    getSearchData(datatable) {
        const searchInput = this.getSearchInput(datatable);
        const data = {};
        if (searchInput && searchInput.value.length > 0) {
            data.search = searchInput.value;
        }
        return data;
    },

    getSearchDataFromURL(datatable, url = window.location.href) {
        const urlParams = BunnyURL.getParams(url);
        let data = {};
        for (let k in urlParams) {
            if (k !== 'page') {
                const input = this.getSearchInput(datatable, k);
                if (input) {
                    input.value = urlParams[k];
                    data[k] = urlParams[k];
                }
            }
        }
        return data;
    },

    search(datatable, text) {
        this.update(datatable, this.getDataUrl(datatable, 1, {search: text}));
    },

    updateURL(datatable, url) {
        window.history.pushState('', '', url);
    },

    update(datatable, url) {
        this.getTable(datatable).classList.remove('active');
        datatable.__bunny_loadingIcon = this.addLoadingIcon(datatable);
        BunnyElement.scrollTo(datatable, 500, -100);
        this.fetchData(datatable, url).then(data => {
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
            this.getTable(datatable).classList.add('active');
            this.updateURL(datatable, url);
            this.removeLoadingIcon(datatable);
        });
    },

    onRedraw(datatable, callback) {
        if (datatable.callbacks === undefined) {
            datatable.callbacks = [];
        }
        datatable.callbacks.push(callback);
    },

    addLoadingIcon(datatable) {
        if (datatable.__bunny_loadingIcon !== undefined) {
            return datatable.__bunny_loadingIcon;
        }
        const img = new Image;
        img.src = this._config.loadingImg;
        img.style.opacity = 0.5;
        img.style.position = 'absolute';
        img.style.top = '30%';
        img.style.left = '50%';
        datatable.appendChild(img);
        return img;
    },

    removeLoadingIcon(datatable) {
        datatable.removeChild(datatable.__bunny_loadingIcon);
        delete datatable.__bunny_loadingIcon;
    }

};

DataTable.initAll();
