
import { Ajax } from './bunny.ajax';
import { Template } from './bunny.template';
import { Pagination } from './Pagination';
import { BunnyURL } from './url';
import { ready, addEventOnce } from './utils/DOM';
import { pushCallbackToElement, callElementCallbacks, initObjectExtensions } from './utils/core';

export const DataTableConfig = {
  tagName: 'datatable',
  attrUrl: 'url',
  attrTemplate: 'template',

  tagNamePagination: 'pagination',
  tagNameStats: 'stats',

  perPage: 15,
  paginationLimit: 7,

  loadingImg: '/img/loading.svg',

  searchInputName: 'search',

  ajaxHeaders: []
};

export const DataTableUI = {

  Config: DataTableConfig,
  Template: Template,

  getSearchInput(datatable, name = DataTableConfig.searchInputName) {
    return datatable.querySelector('[name="' + name + '"]') || false;
  },

  getTable(datatable) {
    return datatable.getElementsByTagName('table')[0];
  },

  getPagination(datatable) {
    return datatable.getElementsByTagName(this.Config.tagNamePagination)[0];
  },

  getStats(datatable) {
    return datatable.getElementsByTagName(this.Config.tagNameStats)[0];
  },

  removeRows(datatable) {
    const table = this.getTable(datatable);
    const rowCount = table.rows.length;
    for (let i = rowCount - 1; i > 0; i--) {
      table.deleteRow(i);
    }
  },

  insertRows(datatable, rowsData, templateId) {
    this.Template.insertAll(templateId, rowsData, this.getTable(datatable));
  },

};

export const DataTable = {

  Config: DataTableConfig,
  UI: DataTableUI,

  Ajax: Ajax,
  Pagination: Pagination,

  init(datatable) {
    if (datatable.__bunny_datatable === undefined) {
      datatable.__bunny_datatable = {};
    } else {
      return false;
    }

    let page = BunnyURL.getParam('page');
    if (page === undefined) {
      page = 1;
    }

    this.addEvents(datatable);

    initObjectExtensions(this, datatable);

    this.changePage(datatable, page, this.getSearchDataFromURL(datatable));

    return true;
  },

  initAll() {
    ready( () => {
      [].forEach.call(document.getElementsByTagName(this.Config.tagName), datatable => {
        this.init(datatable);
      })
    });
  },

  isInitiated(datatable) {
    return datatable.__bunny_datatable !== undefined;
  },



  getTemplateId(datatable) {
    return datatable.getAttribute(this.Config.attrTemplate);
  },

  getAjaxUrl(datatable) {
    return datatable.getAttribute(this.Config.attrUrl);
  },

  getAjaxHeaders() {
    let headers = {};
    DataTableConfig.ajaxHeaders.forEach(header => {
      const parts = header.split(': ');
      headers[parts[0]] = parts[1];
    });
    return headers;
  },

  addAjaxHeader(header) {
    this.Config.ajaxHeaders.push(header);
  },

  getSearchData(datatable) {
    const searchInput = this.UI.getSearchInput(datatable);
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
        const input = this.UI.getSearchInput(datatable, k);
        if (input) {
          input.value = urlParams[k];
          data[k] = urlParams[k];
        }
      }
    }
    return data;
  },

  getDataUrl(datatable, page, urlParams = {}) {
    let url = this.Pagination.addPageParamToUrl(this.getAjaxUrl(datatable), page);
    for (let k in urlParams) {
      url += '&' + k + '=' + urlParams[k];
    }
    return url;
  },



  addEvents(datatable) {
    const searchInput = this.UI.getSearchInput(datatable);
    if (searchInput) {
      addEventOnce(searchInput, 'input', () => {
        this.search(datatable, searchInput.value);
      });
    }
  },

  attachPaginationEventHandlers(datatable) {
    const pg = this.UI.getPagination(datatable);
    this.Pagination.onItemClick(pg, (page, url) => {
      this.changePage(datatable, page);
    });
  },

  callHandlers(datatable, data) {
    callElementCallbacks(datatable, 'datatable_redraw', (cb) => {
      cb(data);
    })
  },

  callBeforeHandlers(datatable, data) {
    callElementCallbacks(datatable, 'datatable_before_redraw', (cb) => {
      cb(data);
    })
  },

  onBeforeRedraw(datatable, callback) {
    pushCallbackToElement(datatable, 'datatable_before_redraw', callback);
  },

  onRedraw(datatable, callback) {
    pushCallbackToElement(datatable, 'datatable_redraw', callback);
  },



  fetchData(datatable, url) {
    return new Promise(callback => {
      this.Ajax.get(url, data => {
        data = JSON.parse(data);
        callback(data);
      }, {}, this.getAjaxHeaders());
    });
  },

  changePage(datatable, page, data = null) {
    if (data === null) {
      data = this.getSearchData(datatable);
    }
    this.update(datatable, this.getDataUrl(datatable, page, data));
  },

  search(datatable, text) {
    this.update(datatable, this.getDataUrl(datatable, 1, {search: text}));
  },

  updateURL(datatable, url) {
    let newURL = window.location.href;

    const page = BunnyURL.getParam('page', url);
    if (page > 1) {
      newURL = BunnyURL.setParam('page', page);
    } else if (BunnyURL.hasParam('page', newURL)) {
      newURL = BunnyURL.removeParam('page', newURL);
    }



    const search = BunnyURL.getParam('search', url);
    if (search && search !== '') {
      newURL = BunnyURL.setParam('search', search, newURL);
    } else if (BunnyURL.hasParam('search', newURL)) {
      newURL = BunnyURL.removeParam('search', newURL);
    }

    if (newURL !== window.location.href) {
      window.history.replaceState('', '', newURL);
    }
  },

  update(datatable, url) {
    this.callBeforeHandlers(datatable);
    this.UI.getTable(datatable).classList.remove('in');
    this.fetchData(datatable, url).then(data => {
      const pg = this.UI.getPagination(datatable);
      const Pagination = this.Pagination;
      Pagination.initOrUpdate(pg, data);
      this.attachPaginationEventHandlers(datatable);
      const stats = this.UI.getStats(datatable);
      if (stats !== undefined) {
        stats.textContent = Pagination.getStats(pg);
      }
      this.UI.removeRows(datatable);
      this.UI.insertRows(datatable, data.data, this.getTemplateId(datatable));
      this.UI.getTable(datatable).classList.add('in');
      this.updateURL(datatable, url);
      this.callHandlers(datatable, data);
    });
  }

};

DataTable.initAll();
