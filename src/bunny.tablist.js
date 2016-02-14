
export var TabList = {
    _tabLists: {},
    define: function(tablist_id) {

        var tablist = document.getElementById(tablist_id);

        if (tablist === null) {
            console.error('TabList.define() error: TabList with ID "'+tablist_id+'" does not exists!');
            return false;
        }
        var active_link = tablist.querySelector('.active');
        var active_tab_pane_id = active_link.getAttribute('href').substring(1);
        var active_tab_pane = document.getElementById(active_tab_pane_id);
        var links = {};
        var self = this;

        tablist.querySelectorAll('.nav-link').forEach(function(nav_link) {
            var nav_link_id = nav_link.getAttribute('href').substring(1);
            nav_link.addEventListener('click', function(e){
                e.preventDefault();
                self.changeTab(nav_link_id);
            });
            links[nav_link_id] = nav_link;
        });

        this._tabLists[tablist_id] = {
            el: document.getElementById(tablist_id),
            activeLink: active_link,
            activeTabPaneId: active_tab_pane_id,
            activeTabPane: active_tab_pane,
            links: links
        }
    },

    getTabListIdByTabId: function(tab_id) {
        for (var tablist_id in this._tabLists) {
            for (var link_id in this._tabLists[tablist_id].links) {
                if (link_id === tab_id) {
                    return tablist_id;
                }
            }
        }
        return false;
    },

    changeTab: function(tab_id) {

        var tablist_id = this.getTabListIdByTabId(tab_id);
        if (tablist_id === false) {
            console.error('TabList.changeTab() error: tab with ID "'+tab_id+'" not found or TabList is not defined.');
            return false;
        }

        var active_link = this._tabLists[tablist_id].activeLink;
        var active_tab_pane = this._tabLists[tablist_id].activeTabPane;
        var nav_link = this._tabLists[tablist_id].links[tab_id];

        // remove active state from old active link
        active_link.setAttribute('aria-expanded', 'false');
        active_link.classList.remove('active');
        // add active state to new link
        nav_link.setAttribute('aria-expanded', 'true');
        nav_link.classList.add('active');
        // remove active state from old tab pane
        if (active_tab_pane.classList.contains('fade')) {
            active_tab_pane.classList.remove('in');
            setTimeout(function() {
                active_tab_pane.setAttribute('aria-expanded', 'false');
                active_tab_pane.classList.remove('active');
            }, 150);
        } else {
            active_tab_pane.setAttribute('aria-expanded', 'false');
            active_tab_pane.classList.remove('active');
        }
        // add active state to new tab pane
        var tab_pane = document.getElementById(tab_id);
        if (tab_pane.classList.contains('fade')) {
            setTimeout(function() {
                tab_pane.setAttribute('aria-expanded', 'true');
                tab_pane.classList.add('active');
                tab_pane.classList.add('in');
            }, 150);
        } else {
            tab_pane.setAttribute('aria-expanded', 'true');
            tab_pane.classList.add('active');
        }
        // set active link to a new link
        this._tabLists[tablist_id].activeLink = nav_link;
        this._tabLists[tablist_id].activeTabPaneId = tab_id;
        this._tabLists[tablist_id].activeTabPane = tab_pane;
    },

    get: function(tablist_id) {
        return this._tabLists[tablist_id];
    }
};

document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('[role="tablist"]').forEach(function(tablist) {
        var tablist_id = tablist.getAttribute('id');
        TabList.define(tablist_id);
    });
}, false);
