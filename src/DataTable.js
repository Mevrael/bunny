
import { Ajax } from './bunny.ajax';
import { Template } from './bunny.template';
import { Pagination } from './Pagination';
import { BunnyURL } from './url';
import { ready, addEventOnce, makeAccessible, parseTemplate} from './utils/DOM';
import { pushCallbackToElement, callElementCallbacks, initObjectExtensions } from './utils/core';

export const DataTableConfig = {
  tagName: 'datatable',
  attrUrl: 'url',
  attrTemplate: 'template',

  tagNamePagination: 'pagination',
  tagNameStats: 'stats',

  classNameAsc: 'arrow-down',
  classNameDesc: 'arrow-up',

  perPage: 15,
  paginationLimit: 7,

  ajaxHeaders: []
};

export const DataTableUI = {

  Config: DataTableConfig,
  Template: Template,

  getSearchInput(datatable, name) {
    return datatable.querySelector('[name="' + name + '"]') || false;
  },

  getColumn(datatable, name) {
    return this.getTable(datatable).querySelector('[pid="' + name + '"]') || false;
  },

  getAllSearchInputs(datatable) {
    return datatable.querySelectorAll('input, select');
  },

  getTable(datatable) {
    return datatable.getElementsByTagName('table')[0];
  },

  getOrderCells(datatable) {
    return datatable.querySelectorAll('th[pid]');
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
    const tpl = document.getElementById(templateId);
    if (tpl.tagName === 'TEMPLATE') {
      this.getTable(datatable).appendChild(parseTemplate(templateId, rowsData));
    } else {
      this.Template.insertAll(templateId, rowsData, this.getTable(datatable));
    }
  },

  clearAllColumnsOrder(thCell) {
    const thCells = thCell.parentNode.querySelectorAll('th');
    [].forEach.call(thCells, cell => {
      cell.classList.remove(this.Config.classNameAsc);
      cell.classList.remove(this.Config.classNameDesc);
    });
  },

  setColumnAsc(thCell) {
    this.clearAllColumnsOrder(thCell);
    thCell.classList.add(this.Config.classNameAsc);
  },

  setColumnDesc(thCell) {
    this.clearAllColumnsOrder(thCell);
    thCell.classList.add(this.Config.classNameDesc);
  },

  isColumnAsc(thCell) {
    return thCell.classList.contains(this.Config.classNameAsc);
  },

  isColumnDesc(thCell) {
    return thCell.classList.contains(this.Config.classNameDesc);
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

    const orderData = this.getOrderDataFromURL(datatable);
    if (orderData['order_by'] !== undefined) {
      const thCell = this.UI.getColumn(datatable, orderData['order_by']);
      if (orderData['order_rule'] === 'asc') {
        this.UI.setColumnAsc(thCell);
      } else {
        this.UI.setColumnDesc(thCell);
      }
    }

    this.setARIA(datatable);

    this.changePage(datatable, page, this.getSearchAndOrderDataFromURL(datatable));

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
    const searchInputs = this.UI.getAllSearchInputs(datatable);
    const data = {};
    [].forEach.call(searchInputs, searchInput => {
      if (searchInput && searchInput.value.length > 0) {
        data[searchInput.name] = searchInput.value;
      }
    });
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


  getOrderData(datatable) {
    const data = {};
    const thCells = this.UI.getOrderCells(datatable);
    for (let k = 0; k < thCells.length; k++) {
      const thCell = thCells[k];
      if (this.UI.isColumnAsc(thCell)) {
        data['order_by'] = thCell.getAttribute('pid');
        data['order_rule'] = 'asc';
        break;
      } else if (this.UI.isColumnDesc(thCell)) {
        data['order_by'] = thCell.getAttribute('pid');
        data['order_rule'] = 'desc';
        break;
      }
    }
    return data;
  },

  getOrderDataFromURL(datatable, url = window.location.href) {
    const urlParam = BunnyURL.getParam('order_by', url);
    let data = {};
    if (urlParam) {
      data['order_by'] = urlParam;
      data['order_rule'] = BunnyURL.getParam('order_rule', url);
    }
    return data;
  },


  getSearchAndOrderData(datatable) {
    return Object.assign(this.getSearchData(datatable), this.getOrderData(datatable));
  },

  getSearchAndOrderDataFromURL(datatable) {
    return Object.assign(this.getSearchDataFromURL(datatable), this.getOrderDataFromURL(datatable));
  },


  getDataUrl(datatable, page, urlParams = {}) {
    let url = this.Pagination.addPageParamToUrl(this.getAjaxUrl(datatable), page);
    url = BunnyURL.setParams(urlParams, url);
    return url;
  },



  addEvents(datatable) {
    const searchInputs = this.UI.getAllSearchInputs(datatable);
    [].forEach.call(searchInputs, searchInput => {
      const eventName = searchInput.tagName === 'INPUT' ? 'input' : 'change';
      addEventOnce(searchInput, eventName, () => {
        this.update(datatable, this.getDataUrl(datatable, 1, this.getSearchAndOrderData(datatable)));
      });
    });

    const thCells = this.UI.getOrderCells(datatable);
    [].forEach.call(thCells, thCell => {
      thCell.addEventListener('click', () => {
        if (this.UI.isColumnAsc(thCell)) {
          this.UI.setColumnDesc(thCell);
          this.update(datatable, this.getDataUrl(datatable, this.getPage(), this.getSearchAndOrderData(datatable)));
        } else if (this.UI.isColumnDesc(thCell)) {
          this.UI.clearAllColumnsOrder(thCell);
          this.update(datatable, this.getDataUrl(datatable, this.getPage(), this.getSearchData(datatable)));
        } else {
          this.UI.setColumnAsc(thCell);
          this.update(datatable, this.getDataUrl(datatable, this.getPage(), this.getSearchAndOrderData(datatable)));
        }
      });
    });
  },

  setARIA(datatable) {
    const thCells = this.UI.getOrderCells(datatable);
    [].forEach.call(thCells, thCell => {
      makeAccessible(thCell);
    });
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
      data = this.getSearchAndOrderData(datatable);
    }
    this.update(datatable, this.getDataUrl(datatable, page, data));
  },

  getPage() {
    const page = BunnyURL.getParam('page');
    if (page) {
      return page;
    }
    return 1;
  },

  /*search(datatable, param, text) {
    this.update(datatable, this.getDataUrl(datatable, 1, {[param]: text}));
  },*/

  updateURL(datatable, url) {
    let newURL = window.location.href;

    const page = BunnyURL.getParam('page', url);
    if (page > 1) {
      newURL = BunnyURL.setParam('page', page);
    } else if (BunnyURL.hasParam('page', newURL)) {
      newURL = BunnyURL.removeParam('page', newURL);
    }

    const orderBy = BunnyURL.getParam('order_by', url);
    if (orderBy) {
      newURL = BunnyURL.setParam('order_by', orderBy, newURL);
      newURL = BunnyURL.setParam('order_rule', BunnyURL.getParam('order_rule', url), newURL);
    }

    const searchInputs = this.UI.getAllSearchInputs(datatable);
    [].forEach.call(searchInputs, searchInput => {
      const searchParam = searchInput.name;
      const search = BunnyURL.getParam(searchParam, url);
      if (search && search !== '') {
        newURL = BunnyURL.setParam(searchParam, search, newURL);
      } else if (BunnyURL.hasParam(searchParam, newURL)) {
        newURL = BunnyURL.removeParam(searchParam, newURL);
      }
    });

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
      Pagination.initOrUpdate(pg, data, this.getSearchAndOrderData(datatable));
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
