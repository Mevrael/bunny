
export const TabSectionConfig = {

    tagName: 'tabsection',
    tagNameList: 'tablist',
    tagNameTab: 'tab',
    tagNamePanel: 'tabpanel',

    animate: true,
    animationDelay: 0.15,
    classFade: 'fade',
    classFadeIn: 'active'

};

export const TabSectionUI = {

    Config: TabSectionConfig,

    getAllTabSections(node = document) {
        return node.getElementsByTagName(this.Config.tagName);
    },

    getTabList(tabsection) {
        return tabsection.getElementsByTagName(this.Config.tagNameList)[0] || false;
    },

    getTabs(tablist) {
        return tablist.getElementsByTagName(this.Config.tagNameTab);
    },

    getTabPanels(tabsection) {
        return tabsection.getElementsByTagName(this.Config.tagNamePanel);
    },

    getActiveTab(tabsection) {
        const tabList = this.getTabList(tabsection);
        const tabs = this.getTabs(tabList);
        for (let k = 0; k < tabs.length; k++) {
            if (tabs[k].hasAttribute('selected')) {
                return tabs[k];
            }
        }
        return false;
    },

    getActiveTabPanel(tabsection) {
        const tabpanels = this.getTabPanels(tabsection);
        for (let k = 0; k < tabpanels.length; k++) {
            if (!tabpanels[k].hasAttribute('hidden')) {
                return tabpanels[k];
            }
        }
        return false;
    },

    getTabSectionByTab(tab) {
        return tab.parentNode.parentNode;
    },

    getTabSectionByTabPanel(tabpanel) {
        return tabpanel.parentNode;
    },

    getTabIndex(tab) {
        return [].indexOf.call(tab.parentNode.children, tab);
    },

    getTabPanelIndex(tabpanel) {
        const tabsection = this.getTabSectionByTabPanel(tabpanel);
        const tabpanels = this.getTabPanels(tabsection);
        let tabPanelIndex = 0;
        [].forEach.call(tabpanels, tp => {
            if (tp === tabpanel) {
                return tabPanelIndex;
            }
            tabPanelIndex++;
        });
        return false;
    },

    getTabPanelByTab(tab) {
        const tabIndex = this.getTabIndex(tab);
        const tabsection = this.getTabSectionByTab(tab);
        const tabpanels = this.getTabPanels(tabsection);
        return tabpanels[tabIndex];
    },

    getTabByTabPanel(tabpanel) {
        const tabPanelIndex = this.getTabPanelIndex(tabpanel);
        const tabsection = this.getTabSectionByTabPanel(tabpanel);
        const tablist = this.getTabList(tabsection);
        const tabs = this.getTabs(tablist);
        return tabs[tabPanelIndex];
    },

    setTabActive(tab) {
        tab.setAttribute('selected', '');
    },

    setTabInactive(tab) {
        tab.removeAttribute('selected');
    },

    setTabPanelVisible(tabpanel) {
        return new Promise(resolve => {
            if (this.Config.animate) {
                tabpanel.removeAttribute('hidden');
                tabpanel.classList.add(this.Config.classFadeIn);
                setTimeout(() => {
                    resolve();
                }, this.Config.animationDelay * 1000);
            } else {
                tabpanel.removeAttribute('hidden');
                resolve();
            }
        });
    },

    setTabPanelHidden(tabpanel) {
        return new Promise(resolve => {
            if (this.Config.animate) {
                tabpanel.classList.remove(this.Config.classFadeIn);
                setTimeout(() => {
                    tabpanel.setAttribute('hidden', '');
                    resolve();
                }, this.Config.animationDelay * 1000);
            } else {
                tabpanel.setAttribute('hidden', '');
                resolve();
            }
        });
    },

    switchTab(tab) {
        const tabsection = this.getTabSectionByTab(tab);
        const tabpanel = this.getTabPanelByTab(tab);
        const activeTab = this.getActiveTab(tabsection);
        const activeTabPanel = this.getActiveTabPanel(tabsection);

        if (tab !== activeTab) {
            this.setTabInactive(activeTab);
            this.setTabPanelHidden(activeTabPanel).then(() => {
                this.setTabActive(tab);
                this.setTabPanelVisible(tabpanel);
            });
        }
    },

    switchTabPanel(tabpanel) {
        const tab = this.getTabByTabPanel(tabpanel);
        const tabsection = this.getTabSectionByTabPanel(tabpanel);
        const activeTab = this.getActiveTab(tabsection);
        const activeTabPanel = this.getActiveTabPanel(tabsection);

        if (tabpanel !== activeTabPanel) {
            this.setTabInactive(activeTab);
            this.setTabPanelHidden(activeTabPanel).then(() => {
                this.setTabActive(tab);
                this.setTabPanelVisible(tabpanel);
            });
        }
    },

};

export const TabSection = {

    Config: TabSectionConfig,
    UI: TabSectionUI,

    init(tabsection) {
        this.addEvents(tabsection);
        if (this.Config.animate) {
            this.initAnimationClass(tabsection);
        }
    },

    initAll() {
        const tabsections = this.UI.getAllTabSections();
        [].forEach.call(tabsections, tabsection => {
            this.init(tabsection);
        })
    },

    addEvents(tabsection) {
        const tablist = this.UI.getTabList(tabsection);
        const tabs = this.UI.getTabs(tablist);
        [].forEach.call(tabs, tab => {
            tab.addEventListener('click', () => {
                this.UI.switchTab(tab);
            });
        })
    },

    initAnimationClass(tabsection) {
        const tabpanels = this.UI.getTabPanels(tabsection);
        [].forEach.call(tabpanels, tabpanel => {
            tabpanel.classList.add(this.Config.classFade);
        });
        const actibeTabPanel = this.UI.getActiveTabPanel(tabsection);
        actibeTabPanel.classList.add(this.Config.classFadeIn);
    }

};

document.addEventListener('DOMContentLoaded', () => {
    TabSection.initAll();
});
