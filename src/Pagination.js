
import { BunnyURL } from './url';

export const PaginationConfig = {

  // HTML tags and attributes
  tagName: 'pagination',
  attrLimit: 'limit',
  attrOuter: 'outer', // boolean attribute - display or not first/last buttons

  tagNameItem: 'li',
  tagNameLink: 'a',
  attrLinkUrl: 'href',

  // default attribute values
  attrLimitDefault: 7,
  attrOuterDefault: false,

  // CSS styling
  classItem: 'page-item',
  classItemDisabled: 'disabled',
  classItemActive: 'active',
  classLink: 'page-link',

  // language strings
  langFirst: 'First',
  langLast: 'Last',
  langPrevious: '< Previous',
  langNext: 'Next >',
  langStats: '{from}-{to} of total {total} (Page {currentPage} of {lastPage})',

  // HTTP GET param names in URL
  paramPage: 'page'

};

export const Pagination = {

  _config: PaginationConfig,

  _collection: [],
  _callbacks: [],
  _dataCollection: [],

  _attachEventHandlers(pagination) {
    const items = this.getItems(pagination);
    [].forEach.call(items, item => {
      //if (!this.isItemActive(item) && !this.isItemDisabled(item)) {
      this._attachSingleEventHandler(item);
      //}
    });
  },

  _getIndex(pagination) {
    for (let k =0; k < this._collection.length; k++) {
      if (this._collection[k] === pagination) {
        return k;
      }
    }
    return false;
  },

  onItemClick(pagination, callback) {
    const index = this._getIndex(pagination);
    this._callbacks[index].push(callback);
  },

  getPaginationByItem(item) {
    return item.parentNode;
  },

  _attachSingleEventHandler(item) {
    const pagination = this.getPaginationByItem(item);
    const index = this._getIndex(pagination);
    const link = this.getLinkByItem(item);
    const callbacks = this._callbacks[index];
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (callbacks.length > 0) {
        const url = link.getAttribute('href');
        const page = this.getPageFromUrl(url);
        this._callbacks[index].forEach(callback => {
          callback(page, url);
        })
      }
    })
  },

  getLimit(pagination) {
    let limit = pagination.getAttribute(this._config.attrLimit);
    if (limit === null) {
      limit = this._config.attrLimitDefault;
    }
    return limit;
  },

  isOuter(pagination) {
    let outer = pagination.hasAttribute(this._config.attrOuter);
    if (outer === false) {
      outer = this._config.attrOuterDefault;
    }
    return outer;
  },

  getItems(pagination) {
    return pagination.getElementsByClassName(this._config.classItem);
  },

  isItemDisabled(item) {
    return item.classList.contains(this._config.classItemDisabled);
  },

  isItemActive(item) {
    return item.classList.contains(this._config.classItemActive);
  },

  setItemActive(item) {
    item.classList.add(this._config.classItemActive);
  },

  isItemDisabled(item) {
    return item.classList.add(this._config.classItemDisabled);
  },

  getLinkByItem(item) {
    return item.getElementsByClassName(this._config.classLink)[0];
  },

  createItem(url, text, active = false, disabled = false) {
    const item = document.createElement(this._config.tagNameItem);
    item.classList.add(this._config.classItem);
    if (active) {
      item.classList.add(this._config.classItemActive);
    }
    if (disabled) {
      item.classList.add(this._config.classItemDisabled);
    }
    const link = document.createElement(this._config.tagNameLink);
    link.setAttribute(this._config.attrLinkUrl, url);
    link.classList.add(this._config.classLink);
    link.textContent = text;
    item.appendChild(link);
    return item;
  },

  createPageItem(pagination, page) {
    return this.createItem(this.getPageUrl(pagination, page), page, this.isPage(pagination, page));
  },

  createFirstItem(pagination) {
    return this.createItem(this.getFirstPageUrl(pagination), this._config.langFirst, false, this.isFirstPage(pagination));
  },

  createPrevItem(pagination) {
    return this.createItem(this.getPrevPageUrl(pagination), this._config.langPrevious, false, this.isFirstPage(pagination));
  },

  createNextItem(pagination) {
    return this.createItem(this.getNextPageUrl(pagination), this._config.langNext, false, this.isLastPage(pagination));
  },

  createLastItem(pagination) {
    return this.createItem(this.getLastPageUrl(pagination), this._config.langLast, false, this.isLastPage(pagination));
  },

  removeItems(pagination) {
    while (pagination.firstChild) {
      pagination.removeChild(pagination.firstChild);
    }
  },

  getStats(pagination) {
    if (!this.hasPages(pagination)) {
      return '';
    }
    let str = this._config.langStats;
    const data = this.getData(pagination);
    for (let key in data) {
      str = str.replace('{' + key + '}', data[key]);
    }
    return str;
  },

  _getPaginationData(data, urlParams = null) {
    const nextPageUrl = urlParams === null || data.next_page_url === null ? data.next_page_url : BunnyURL.setParams(urlParams, data.next_page_url);
    const prevPageUrl = urlParams === null || data.prev_page_url === null ? data.prev_page_url : BunnyURL.setParams(urlParams, data.prev_page_url);
    return {
      count: parseInt(data.to) - parseInt(data.from) + 1,
      currentPage: parseInt(data.current_page),
      lastPage: parseInt(data.last_page),
      nextPageUrl: nextPageUrl,
      perPage: parseInt(data.per_page),
      previousPageUrl: prevPageUrl,
      total: parseInt(data.total),
      from: parseInt(data.from),
      to: parseInt(data.to)
    };
  },

  getData(pagination) {
    return this._dataCollection[this._getIndex(pagination)];
  },

  hasPages(pagination) {
    const data = this.getData(pagination);
    return data.total > data.perPage;
  },

  getCount(pagination) {
    return this.getData(pagination).count;
  },

  getCurrentPage(pagination) {
    return this.getData(pagination).currentPage;
  },

  getLastPage(pagination) {
    return this.getData(pagination).lastPage;
  },

  getPageUrl(pagination, page) {
    return this._getUrlForPage(pagination, page);
  },

  getFirstPageUrl(pagination) {
    return this._getUrlForPage(pagination, 1);
  },

  getLastPageUrl(pagination) {
    return this._getUrlForPage(pagination, this.getLastPage(pagination));
  },

  getPrevPageUrl(pagination) {
    return this.getData(pagination).previousPageUrl;
  },

  getNextPageUrl(pagination) {
    return this.getData(pagination).nextPageUrl;
  },

  getTotal(pagination) {
    return this.getData(pagination).total;
  },

  getFrom(pagination) {
    return this.getData(pagination).from;
  },

  getTo(pagination) {
    return this.getData(pagination).to;
  },

  getPerPage(pagination) {
    return this.getData(pagination).perPage;
  },

  isLastPage(pagination) {
    return this.isPage(pagination, this.getLastPage(pagination));
  },

  isFirstPage(pagination) {
    return this.isPage(pagination, 1);
  },

  isPage(pagination, page) {
    return this.getCurrentPage(pagination) === page;
  },

  addPageParamToUrl(url, page) {
    const sep = (url.indexOf('?') === -1) ? '?' : '&';
    return url + sep + this._config.paramPage + '=' + page;
  },

  getPageFromUrl(url) {
    return BunnyURL.getParam(this._config.paramPage, url);
  },

  _getUrlForPage(pagination, page) {
    const index = this._getIndex(pagination);
    const pData = this._dataCollection[index];
    let url = '';
    let tmp_page = 1;
    if (pData.nextPageUrl !== null) {
      url = pData.nextPageUrl;
      tmp_page = pData.currentPage + 1;
    } else if (pData.previousPageUrl !== null) {
      url = pData.previousPageUrl;
      tmp_page = pData.currentPage - 1;
    } else {
      throw new Error('Bunny Pagination: Server returned null for nextPageUrl and previousPageUrl');
    }
    return url.replace('page=' + tmp_page, 'page=' + page);
  },

  redraw(pagination) {
    this.removeItems(pagination);
    if (!this.hasPages(pagination)) {
      return false;
    }

    const isOuter = this.isOuter(pagination);
    const limit = this.getLimit(pagination);
    const lastPage = this.getLastPage(pagination);
    const currentPage = this.getCurrentPage(pagination);

    const f = document.createDocumentFragment();

    this.getData(pagination);

    if (isOuter) {
      f.appendChild(this.createFirstItem(pagination));
    }
    f.appendChild(this.createPrevItem(pagination));

    for (let k = 1; k <= lastPage; k++) {
      const half = Math.floor(limit / 2);
      let from = currentPage - half;
      let to = currentPage + half;
      if (currentPage < half) {
        to += half - currentPage;
      }
      if (lastPage - currentPage < half) {
        from -= half - (lastPage - currentPage) - 1;
      }
      if (from < k && k < to) {
        f.appendChild(this.createPageItem(pagination, k));
      }
    }

    f.appendChild(this.createNextItem(pagination));
    if (isOuter) {
      f.appendChild(this.createLastItem(pagination));
    }

    pagination.appendChild(f);

    return true;
  },


  initOrUpdate(pagination, data, urlParams = null) {
    const index = this._getIndex(pagination);
    if (index === false) {
      this._collection.push(pagination);
      this._dataCollection.push(this._getPaginationData(data, urlParams));
      this._callbacks.push([]);
    } else {
      this._dataCollection[index] = this._getPaginationData(data, urlParams);
      this._callbacks[index] = []; // clear callbacks
    }
    this.redraw(pagination);
    this._attachEventHandlers(pagination);
  },
};
