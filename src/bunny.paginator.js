
export var Paginator = {
    create: function(id, data, link_limit = 7) {
        return {
            _id: id,
            count: data.to - data.from + 1,
            currentPage: data.current_page,
            hasMorePages: false,
            lastPage: data.last_page,
            nextPageUrl: data.next_page_url,
            perPage: data.per_page,
            previousPageUrl: data.prev_page_url,
            total: data.total,
            from: data.from,
            to: data.to,
            url: function(page) {
                var url = '';
                var tmp_page = 1;
                if (data.next_page_url !== null) {
                    url = data.next_page_url;
                    tmp_page = data.current_page + 1;
                } else {
                    url = data.prev_page_url;
                    tmp_page = data.current_page - 1;
                }
                return url.replace('page=' + tmp_page, 'page=' + page);
            },
            createButton: function(url, cl, text) {
                var e = document.createElement('li');
                e.className = cl;
                var l = document.createElement('a');
                l.setAttribute('href', url);
                l.className = 'page-link';
                l.innerHTML = text;
                e.appendChild(l);
                return e;
            },
            redraw: function() {
                var paginator_el = document.getElementById(this._id + '_pagination');
                var f = document.createDocumentFragment();
                var cl = '';

                if (this.currentPage === 1) {
                    cl = 'page-item disabled';
                } else {
                    cl = 'page-item';
                }
                f.appendChild(this.createButton(this.url(1), cl, 'First'));
                f.appendChild(this.createButton(this.previousPageUrl, cl, '< Previous'));

                for (var k = 1; k <= this.lastPage; k++) {

                    var half_total_links = Math.floor(link_limit / 2);
                    var from = this.currentPage - half_total_links;
                    var to = this.currentPage + half_total_links;
                    if (this.currentPage < half_total_links) {
                        to += half_total_links - this.currentPage;
                    }
                    if (this.lastPage - this.currentPage < half_total_links) {
                        from -= half_total_links - (this.lastPage - this.currentPage) - 1;
                    }

                    if (from < k && k < to) {
                        var e = document.createElement('li');
                        if (this.currentPage === k) {
                            e.className = 'page-item active';
                        } else {
                            e.className = 'page-item';
                        }
                        var l = document.createElement('a');
                        l.setAttribute('href', this.url(k));
                        l.className = 'page-link';
                        l.innerHTML = k;
                        e.appendChild(l);
                        f.appendChild(e);
                    }
                }

                if (this.currentPage === this.lastPage) {
                    cl = 'page-item disabled';
                } else {
                    cl = 'page-item';
                }
                f.appendChild(this.createButton(this.nextPageUrl, cl, 'Next >'));
                f.appendChild(this.createButton(this.url(this.lastPage), cl, 'Last'));

                while (paginator_el.firstChild) {
                    paginator_el.removeChild(paginator_el.firstChild);
                }

                paginator_el.appendChild(f);
            },
            updateStats: function() {
                document.getElementById(this._id + '_stats_count').innerHTML = this.count;
                document.getElementById(this._id + '_stats_from').innerHTML = this.from;
                document.getElementById(this._id + '_stats_to').innerHTML = this.to;
                document.getElementById(this._id + '_stats_cur_page').innerHTML = this.currentPage;
                document.getElementById(this._id + '_stats_last_page').innerHTML = this.lastPage;
            }
        };
    }
};
