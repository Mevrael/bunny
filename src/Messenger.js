
import { addEventOnce, removeEvent, addEvent } from './utils/DOM/events';
import { BunnyDate } from './BunnyDate';

export const MessengerConfig = {

    // key names for localStorage
    storageKeyCurrentUser: 'bunny.messenger.currentChannelUser',
    storageKeyMessages: 'bunny.messenger.messages',
    storageKeyAuthUserId: 'bunny.messenger.authUserId',
    storageKeyCacheDate: 'bunny.messenger.dateCached',

    messagesPerPage: 20,
    checkForNewMessagesInterval: 10, //seconds
    cacheLifetime: 3, // hours

    // all elements on page with this attribute will toggle private messenger with userId on click
    // userId must be passed as a value to this attribute
    //
    // to attach click event on elements inserted later use Messenger.initToggles(container)
    // where all elements with this attribute within "container" will be initiated
    initAttribute: 'data-messenger',

    // markup and style settings
    id: 'pm',
    idName: 'pm_name',
    idClose: 'pm_close',
    idBody: 'pm_body',
    idInput: 'pm_input',

    idNotificationsBtn: 'pm_notification_btn',
    attrUnread: 'new',
    tagNotification: 'PMNOTIFICATION',

    classActive: 'active'

};

export const MessengerUI = {

    Config: MessengerConfig,

    // Reader

    getBlock() {
        return document.getElementById(this.Config.id) || false;
    },

    getBody() {
        return document.getElementById(this.Config.idBody) || false;
    },

    getNameBlock() {
        return document.getElementById(this.Config.idName) || false;
    },

    getToggleButtons(container = document) {
        return container.querySelectorAll('[' + this.Config.initAttribute + ']') || false;
    },

    getToggleButtonUserId(btn) {
        const userId = btn.getAttribute(this.Config.initAttribute);
        if (userId === undefined || userId === '') {
            throw new Error(`Bunny Messenger: toggle button should have a non-empty attribute "${this.Config.initAttribute}" value representing ID of the second user`)
        }
        return userId;
    },

    getCloseBtn() {
        return document.getElementById(this.Config.idClose) || false;
    },

    getInput() {
        return document.getElementById(this.Config.idInput) || false;
    },

    getNotificationsBtn() {
        return document.getElementById(this.Config.idNotificationsBtn) || false;
    },

    isNotificationElement(element) {
        return element.tagName === this.Config.tagNotification;
    },

    isNotificationUnread(btn) {
        return btn.hasAttribute(this.Config.attrUnread);
    },

    markNotificationAsRead(btn) {
        btn.removeAttribute(this.Config.attrUnread);
        this.decreaseNotificationCounter();
    },




    // Writer
    clearBody() {
        this.getBody().innerHTML = '';
    },

    setBlockUserName(name) {
        this.getNameBlock().textContent = name;
    },

    appendAnswer(id, text) {
        const msg = this.createAnswer(id, text);
        this.getBody().appendChild(msg);
        this.scrollToBodyBottom();
    },

    appendMessages(messages, currentUser, after = true) {
        const f = this.createAllMessages(messages, currentUser);
        const body = this.getBody();
        if (after) {
            body.appendChild(f);
            this.scrollToBodyBottom();
        } else {
            const firstChild = body.firstChild;
            const originalOffsetTop = firstChild.offsetTop;
            body.insertBefore(f, firstChild);
            const newOffsetTop = firstChild.offsetTop;
            const delta = newOffsetTop - originalOffsetTop + body.scrollTop;
            body.scrollTop = delta;
        }
    },

    openBlockAndAppendMessages(messages, currentUser, focusInput = false) {
        this.setBlockUserName(currentUser.name);
        this.showBlock();
        this.appendMessages(messages, currentUser);
        if (focusInput) {
            this.getInput().focus();
        }
    },

    decreaseNotificationCounter() {
        const btn = this.getNotificationsBtn();
        if (btn) {
            if (btn.dataset.count > 1) {
                btn.dataset.count--;
            } else {
                delete btn.dataset.count;
            }
        }
    },

    increaseNotificationCounter() {
        const btn = this.getNotificationsBtn();
        if (btn) {
            if (btn.dataset.count === undefined) {
                btn.dataset.count = 1;
            } else {
                btn.dataset.count++;
            }
        }
    },



    // Updater

    blinkBlock() {
        this.getBlock().classList.add(this.Config.classActive);
        setTimeout(() => {
            this.getBlock().classList.remove(this.Config.classActive);
        }, 1000);
    },

    showBlock() {
        this.getBlock().removeAttribute('hidden');
    },

    hideBlock() {
        this.getBlock().setAttribute('hidden', '');
    },

    scrollToBodyBottom() {
        const body = this.getBody();
        body.scrollTop = body.scrollHeight;
    },




    // Creator

    createMessage(id, text, sender, image = true) {
        const msg = document.createElement('message');
        msg.dataset.id = id;
        const imgWrapper = document.createElement('div');
        if (image) {
            const link = document.createElement('a');
            link.setAttribute('href', sender.profileUrl);
            const img = new Image;
            img.src = sender.photoUrl;
            link.appendChild(img);
            imgWrapper.appendChild(link);
        }
        const p = document.createElement('p');
        p.textContent = text;
        p.innerHTML = p.innerHTML.replace(/\r?\n/g, '<br />');
        msg.appendChild(imgWrapper);
        msg.appendChild(p);
        return msg;
    },

    createTime(time) {
        const t = document.createElement('time');
        t.textContent = time;
        return t;
    },

    createAnswer(id, text) {
        const msg = document.createElement('message');
        msg.dataset.id = id;
        msg.setAttribute('type', 'answer');
        const p = document.createElement('p');
        p.textContent = text;
        p.innerHTML = p.innerHTML.replace(/\r?\n/g, '<br />');
        msg.appendChild(p);
        return msg;
    },

    createAllMessages(messages, channelCurrentUser) {
        const f = document.createDocumentFragment();
        let prevDateRendered = null;
        messages.forEach(message => {

            const date = BunnyDate.toEuDate(new Date(message.dateCreated));
            if (prevDateRendered !== date) {
                const t = this.createTime(date);
                f.appendChild(t);
                prevDateRendered = date;
            }

            let msg;
            if (Server.user.id == message.senderId) {
                msg = this.createAnswer(message.id, message.message);
            } else {
                msg = this.createMessage(message.id, message.message, channelCurrentUser);
            }

            f.appendChild(msg);
        });
        return f;
    }

};

export const MessengerEvents = {

    UI: MessengerUI,
    Config: MessengerConfig,

    /**
     * @type {Number|null}
     */
    checkForMessagesIntervalId: null,

    addMessageEventId: null,
    blockCloseEventId: null,
    loadOlderMessagesEventId: null,


    addToggleButtonsEvent(handler, container = document) {
        const btns = this.UI.getToggleButtons(container);
        [].forEach.call(btns, btn => {
            btn.addEventListener('click', (event) => {
                handler(this.UI.getToggleButtonUserId(btn), event);
            })
        });
    },





    addBlockCloseEvent(handler) {
        this.blockCloseEventId = addEvent(this.UI.getCloseBtn(), 'click', handler);
    },

    removeBlockCloseEvent() {
        this.blockCloseEventId = removeEvent(this.UI.getCloseBtn(), 'click', this.blockCloseEventId);
    },





    addIntervalCheckForMessages(handler) {
        const interval = this.Config.checkForNewMessagesInterval * 1000;
        this.checkForMessagesIntervalId = setInterval(handler, interval);
    },

    removeIntervalCheckForMessages() {
        clearInterval(this.checkForMessagesIntervalId);
        this.checkForMessagesIntervalId = null;
    },





    addMessageEvent(handler) {
        const input = this.UI.getInput();
        this.addMessageEventId = addEventOnce(input, 'keydown', e => {
            if (!e.shiftKey && e.keyCode === KEY_ENTER) {
                e.preventDefault();
                handler(input.value);
                input.value = '';
            }
        }, 100)
    },

    removeMessageEvent() {
        const input = this.UI.getInput();
        this.addMessageEventId = removeEvent(input, 'keydown', this.addMessageEventId);
    },




    addLoadOlderMessagesEvent(handler) {
        const body = this.UI.getBody();
        this.loadOlderMessagesEventId = addEventOnce(body, 'scroll', e => {
            if (body.scrollTop < 100) {
                handler();
            }
        }, 100);
    },

    removeLoadOlderMessagesEvent() {
        this.loadOlderMessagesEventId = removeEvent(this.UI.getBody(), 'scroll', this.scrollEventId);
    }

};

export const Messenger = {

    Config: MessengerConfig,
    UI: MessengerUI,
    Events: MessengerEvents,

    Model: null,
    curPage: 1,

    checkForMessagesHandler: null,

    handlers: {
        messagesReceived: [],
        messageSent: []
    },

    init(Model, authUserId) {
        if (this.testInit() === false) {
            return false;
        }
        this.testModel(Model);
        this.Model = Model;
        this.authUserId = authUserId;

        this.initToggles();

        this.checkChannelAuth(authUserId);

        if (this.isChannelInitialized()) {
            this.open();
        }
        return true;
    },

    checkChannelAuth(authUserId) {
        const storedAuthUserId = this.getAuthUserId();
        if (storedAuthUserId !== null && storedAuthUserId != authUserId) {
            // different auth user ID, destroy channel
            this.destroyChannel();
        }
    },

    initToggles(container = document) {
        this.Events.addToggleButtonsEvent(this.toggleChannel.bind(this), container)
    },


    extendConfig(Config) {
        const NewConfig = Object.assign(this.Config, Config);
        this.Config = NewConfig;
        this.UI.Config = NewConfig;
        this.Events.Config = NewConfig;
    },

    extendUI(UI) {
        const NewUI = Object.assign(this.UI, UI);
        this.UI = NewUI;
        this.Events.UI = NewUI;
    },

    extendEvents(Events) {
        const NewEvents = Object.assign(this.Events, Events);
        this.Events = NewEvents;
    },




    onMessagesReceived(callback) {
        this.handlers.messagesReceived.push(callback);
    },

    onMessageSent(callback) {
        this.handlers.messageSent.push(callback);
    },

    testInit() {
        return this.UI.getBlock() !== false;
    },

    testModel(Model) {
        if (typeof Model.read !== 'function'
            && typeof Model.check !== 'function'
            && typeof Model.create !== 'function')
        {
            throw new Error('Bunny Messenger: Model passed to Messenger.init() does not have methods read(), check() and create()');
        }
    },


    toggleChannel(userId, event) {
        if (this.isChannelInitialized()) {
            const curUser = this.getChannelCurrentUser();
            this.close();
            if (curUser.id != userId) {
                this.open(userId, true);
            }
        } else {
            this.open(userId, true);
        }

        const el = event.currentTarget;
        if (this.UI.isNotificationElement(el)) {
            if (this.UI.isNotificationUnread(el)) {
                this.UI.markNotificationAsRead(el);
            }
        }
    },

    checkForNewMessages() {
        const curUser = this.getChannelCurrentUser();
        this.Model.check(curUser.id, this.getChannelLastMessageId()).then(res => {
            if (res.messages.length > 0) {
                this.handlers.messagesReceived.forEach(messagesReceived => messagesReceived(res.messages));
                this.setChannelMessages(res.messages);
                this.UI.appendMessages(res.messages, curUser);
                this.UI.blinkBlock();
            }
        });
    },

    loadOlderMessages() {
        const curUser = this.getChannelCurrentUser();
        this.Model.read(curUser.id, this.curPage + 1).then(res => {
            if (res.messages.length > 0) {
                this.curPage = this.curPage + 1;
                this.UI.appendMessages(res.messages.reverse(), curUser, false);
            }
        });
    },



    sendMessage(userId, text) {
        this.Model.create(userId, text).then(res => {
            this.handlers.messageSent.forEach(messageSent => messageSent(res));
            this.setChannelMessages(res);
            this.UI.appendAnswer(res.id, text);
        });
    },

    sendMessageToCurrentUser(text) {
        const curUser = this.getChannelCurrentUser();
        this.sendMessage(curUser.id, text);
    },


    /**
     * Shows PM window,
     * Initializes new PM channel, receives last messages between both users
     * Renders messages into window
     *
     * @param userId
     * @param focusInput
     */
    open(userId = null, focusInput = false) {
        this.initChannel(userId).then(messages => {
            const channelCurrentUser = this.getChannelCurrentUser();
            this.UI.openBlockAndAppendMessages(messages, channelCurrentUser, focusInput);
            this.Events.addIntervalCheckForMessages(this.checkForNewMessages.bind(this));
            this.Events.addBlockCloseEvent(this.close.bind(this));
            this.Events.addMessageEvent(this.sendMessageToCurrentUser.bind(this));
            this.Events.addLoadOlderMessagesEvent(this.loadOlderMessages.bind(this));
        });
    },

    close() {
        this.curPage = 1;
        this.UI.hideBlock();
        this.destroyChannel();
        this.UI.clearBody();
        this.Events.removeIntervalCheckForMessages();
        this.Events.removeBlockCloseEvent();
        this.Events.removeMessageEvent();
        this.Events.removeLoadOlderMessagesEvent();
    },




    /**
     * Initializes new private message channel
     * when user opens private message window
     * by clicking on Private message from PM notifications
     * or by clicking send PM button on user profile page
     *
     * Stores in localStorage current user data
     * and last 12 messages
     * If already initialized doesn't do HTTP request again
     *
     * Whenever there is initialized PM channel,
     * on each request PM window is opened
     *
     * Supports only one opened PM window and channel at the same time
     * When new PM to new user is initialized - old one is destroyed / overridden
     *
     * @param {Number|String} userId
     *
     * @returns Promise
     */
    initChannel(userId = null) {
        return new Promise(resolve => {
            if (userId === null) {
                // don't do HTTP request to same user again, get data from localStorage

                // check if cache expired
                if (this.isChannelCacheExpired()) {
                    userId = this.getChannelCurrentUser().id;
                    this._initChannelLoad(userId, resolve);
                } else {
                    // not expired, get last messages from cache
                    const messages = this.getChannelMessages();
                    resolve(messages);
                }
            } else {
                this._initChannelLoad(userId, resolve);
            }
        });
    },

    _initChannelLoad(userId, resolve) {
        this.Model.read(userId).then(res => {
            this.setAuthUserId(this.authUserId);
            this.setChannelCurrentUser(res.user);
            this.setChannelMessages(res.messages.reverse());
            resolve(res.messages);
        });
    },

    isChannelInitialized() {
        return localStorage.getItem(this.Config.storageKeyCurrentUser) !== null;
    },

    getChannelCurrentUser() {
        return JSON.parse(localStorage.getItem(this.Config.storageKeyCurrentUser));
    },

    getChannelMessages() {
        return JSON.parse(localStorage.getItem(this.Config.storageKeyMessages));
    },

    getChannelLastMessageId() {
        const messages = this.getChannelMessages();
        return messages[messages.length - 1].id;
    },

    setAuthUserId(authUserId) {
        return localStorage.setItem(this.Config.storageKeyAuthUserId, authUserId);
    },

    getAuthUserId() {
        return localStorage.getItem(this.Config.storageKeyAuthUserId);
    },

    setChannelCurrentUser(user) {
        localStorage.setItem(this.Config.storageKeyCurrentUser, JSON.stringify(user));
    },

    updateChannelDateCached() {
        localStorage.setItem(this.Config.storageKeyCacheDate, (new Date).toISOString());
    },

    getChannelDateCached() {
        return localStorage.getItem(this.Config.storageKeyCacheDate);
    },

    isChannelCacheExpired() {
        const now = new Date();
        now.setHours(now.getHours() - this.Config.cacheLifetime);
        const dateCached = new Date(this.getChannelDateCached());
        return now > dateCached;
    },

    _addMessageToQueue(queue, message) {
        let newQueue = Object.create(queue);
        if (newQueue.length >= this.Config.messagesPerPage) {
            // queue is full, remove first item
            newQueue.shift();
        }
        newQueue.push(message);
        return newQueue;
    },

    /**
     * Creates or adds/updates message or messages to current channel queue (cache)
     * If queue is full, older messages are removed from queue
     * Stores queue in localStorage
     * Updated date cached
     *
     * @config Queue limit is configured in MessengerConfig.messagesPerPage
     * @config localStorage key name configured in MessengerConfig.storageKeyMessages
     *
     * @param {Array|Object} messages
     *
     * @returns {Array} new messages queue
     */
    setChannelMessages(messages) {
        let currentMessages = this.getChannelMessages();
        if (currentMessages === null) {
            currentMessages = [];
        }

        if (Array.isArray(messages)) {
            messages.forEach(message => {
                currentMessages = this._addMessageToQueue(currentMessages, message);
            });
        } else {
            currentMessages = this._addMessageToQueue(currentMessages, messages);
        }

        localStorage.setItem(this.Config.storageKeyMessages, JSON.stringify(currentMessages));
        this.updateChannelDateCached();
        return currentMessages;
    },

    /**
     * Destroys PM channel, clears localStorage
     */
    destroyChannel() {
        localStorage.removeItem(this.Config.storageKeyCurrentUser);
        localStorage.removeItem(this.Config.storageKeyMessages);
        localStorage.removeItem(this.Config.storageKeyAuthUserId);
        localStorage.removeItem(this.Config.storageKeyCacheDate);
    }

};
