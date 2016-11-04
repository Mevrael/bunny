
export var TabList = {

    _tabContents: {},

    define(tab_content_id) {

        // get tab content element
        var tab_content = document.getElementById(tab_content_id);
        if (tab_content === null) {
            console.error('Bunny TabList error: tab content with ID "' + tab_content_id + '" not found.');
            return false;
        }

        var tab_list_el = null;
        var active_tab_panel = null;
        var active_link = null;

        // get tab panels of tab content
        var tab_panels = [];
        var tab_list_links = [];
        tab_content.querySelectorAll('[role="tabpanel"]').forEach(function (tab_panel) {
            if (tab_panel.id === '') {
                console.error('Bunny TabList error: tab panel does not contain ID attribute.');
                console.error(tab_panel);
                return false;
            }

            // check if tab panel is active
            if (tab_panel.classList.contains('active')) {
                active_tab_panel = tab_panel;
            }

            // get tab list and link (UI control) for this tab content if exists
            var nav_el = null;
            for (var k = 0; k < document.links.length; k++) {
                if (document.links[k].getAttribute('href') === '#' + tab_panel.id) {
                    nav_el = document.links[k];
                    tab_list_el = nav_el.parentNode.parentNode;
                    active_link = tab_list_el.getElementsByClassName('active')[0];
                    tab_list_links = tab_list_el.getElementsByTagName('a');
                    break;
                }
            }

            // assign tab panel element and associated nav element
            tab_panels[tab_panel.id] = {
                el: tab_panel,
                nav: nav_el
            };
        });

        this._tabContents[tab_content_id] = {
            el: tab_content,
            tabPanels: tab_panels,
            tabList: tab_list_el,
            tabListLinks: tab_list_links,
            activeTabPanel: active_tab_panel,
            activeLink: active_link
        };

        this.assignTabLinkClickEvent(tab_content_id);

    },

    assignTabLinkClickEvent(tab_content_id) {
        var self = this;
        this.get(tab_content_id).tabListLinks.forEach(function(tab_link) {
            var tab_panel_id = tab_link.getAttribute('href').substring(1);
            tab_link.addEventListener('click', function(e){
                e.preventDefault();
                self.changeTab(tab_panel_id);
            });
        });
    },

    getTabContentIdByTabPanelId(tab_panel_id) {
        for (var tab_content_id in this._tabContents) {
            if (this._tabContents[tab_content_id].tabPanels[tab_panel_id] !== undefined) {
                return tab_content_id;
            }
        }
        return false;
    },

    changeTab: function(tab_panel_id) {

        var tab_content_id = this.getTabContentIdByTabPanelId(tab_panel_id);
        if (tab_content_id === false) {
            console.error('Bunny TabList.changeTab() error: unable to get tab content ' +
                'associated with tab panel with ID "' + tab_panel_id + '". ' +
                'May be tab content is not defined and should be defined' +
                ' with TabList.define() first or does not have ID');
            return false;
        }
        var tab_content = this.get(tab_content_id);

        var active_tab_panel = tab_content.activeTabPanel;

        var active_link = tab_content.activeLink; // might be null if tab content is not associated with any nav
        var nav_link = tab_content.tabPanels[tab_panel_id].nav; // if active_link null, this also null

        if (active_link !== null) {
            // remove active state from old active link
            active_link.setAttribute('aria-expanded', 'false');
            active_link.classList.remove('active');
            // add active state to new link
            nav_link.setAttribute('aria-expanded', 'true');
            nav_link.classList.add('active');
        }

        // remove active state from old tab panel
        if (active_tab_panel.classList.contains('fade')) {
            active_tab_panel.classList.remove('active');
            setTimeout(function() {
                active_tab_panel.setAttribute('aria-expanded', 'false');
                active_tab_panel.classList.remove('active');
            }, 150);
        } else {
            active_tab_panel.setAttribute('aria-expanded', 'false');
            active_tab_panel.classList.remove('active');
        }
        // add active state to new tab pane
        var tab_panel = document.getElementById(tab_panel_id);
        if (tab_panel.classList.contains('fade')) {
            setTimeout(function() {
                tab_panel.setAttribute('aria-expanded', 'true');
                tab_panel.classList.add('active');
                //tab_panel.classList.add('in');
            }, 150);
        } else {
            tab_panel.setAttribute('aria-expanded', 'true');
            tab_panel.classList.add('active');
        }

        if (active_link !== null) {
            // set active link to a new link
            tab_content.activeLink = nav_link;
        }

        // set active tab panel to new tab pane
        tab_content.activeTabPanel = tab_panel;

    },

    get: function(tab_content_id) {
        if (this._tabContents[tab_content_id] === undefined) {
            console.error('Bunny TabList.get() error: tab content with ID "' + tab_content_id + '" is not defined. Define with TabList.define() first.');
            return false;
        }
        return this._tabContents[tab_content_id];
    }
};

document.addEventListener('DOMContentLoaded', function(){
    document.getElementsByClassName('tab-content').forEach(function(tab_content) {
        TabList.define(tab_content.id);
    });
}, false);
