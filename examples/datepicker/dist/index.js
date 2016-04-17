var CalendarDate = {

    /**
     * Get number of days in month of year
     * @param  year
     * @param  month_index (0-11)
     * @returns  {number} 28-31
     */
    getDaysInMonth: function getDaysInMonth(year, month_index) {
        return new Date(year, month_index + 1, 0).getDate();
    },

    getWeeksInMonth: function getWeeksInMonth(year, month_index) {
        if (this.getDayOfWeekOfFirstMonthDay(year, month_index) === 0 && this.getDaysInMonth(year, month_index) === 28) {
            return 4; // only in February with 28 days when monday is February 1st are 4 weeks
        } else {
                return 5;
            }
    },

    /**
     * Get day of week (monday-sunday) of first day in month of year
     * @param  year
     * @param  month_index (0-11)
     * @returns  {number} day of week index - 0 (monday) - 6 (sunday)
     */
    getDayOfWeekOfFirstMonthDay: function getDayOfWeekOfFirstMonthDay(year, month_index) {
        var d = new Date(year, month_index).getDay();
        if (d === 0) {
            d = 7;
        }
        return d - 1;
    },

    /**
     * Get matrix (table of 4-5 rows and 7 columns) of month of year.
     * Each cell contains month day number (1-31) or null if day belongs to previous/next month
     * Matrix can be used to easily build custom calendar/datepicker
     * @param  year
     * @param  month_index
     * @returns  {Array} - 2D array
     */
    getMonthMatrix: function getMonthMatrix(year, month_index) {
        var first_day_of_week = this.getDayOfWeekOfFirstMonthDay(year, month_index);
        var days_in_month = this.getDaysInMonth(year, month_index);
        var weeks_in_month = this.getWeeksInMonth(year, month_index);

        var matrix = [];
        var day_nr = 1;
        for (var j = 0; j < weeks_in_month; j++) {
            matrix[j] = [];
            for (var k = 0; k < 7; k++) {
                var td = document.createElement('td');
                if (j == 0) {
                    // if first week
                    if (k >= first_day_of_week) {
                        matrix[j][k] = day_nr;
                        day_nr++;
                    } else {
                        matrix[j][k] = null;
                    }
                } else if (j == weeks_in_month - 1) {
                    // if last week
                    if (day_nr <= days_in_month) {
                        matrix[j][k] = day_nr;
                        day_nr++;
                    } else {
                        matrix[j][k] = null;
                    }
                } else {
                    // mid weeks
                    matrix[j][k] = day_nr;
                    day_nr++;
                }
            }
        }
        return matrix;
    },
    getCurrentDate: function getCurrentDate() {
        var date = new Date();
        var year = date.getUTCFullYear();
        var month_index = date.getUTCMonth();
        var day = date.getUTCDate();
        return {
            year: year,
            monthIndex: month_index,
            day: day
        };
    }
};

var CalendarMarkup = {

    lang: {
        daysOfWeeks: ['Mon', 'Thu', 'Wed', 'Thr', 'Fri', 'Sat', 'Sun'],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    },

    createTableHead: function createTableHead() {
        var thead = document.createElement('div');
        var tr = document.createElement('div');
        var th_collection = [];
        for (var k = 0; k < 7; k++) {
            var th = document.createElement('div');
            th.innerHTML = this.lang.daysOfWeeks[k];
            th_collection.push(th);
            tr.appendChild(th);
        }
        thead.appendChild(tr);
        return {
            thead: thead,
            row: tr,
            thCollection: th_collection
        };
    },

    createTableBody: function createTableBody(year, month_index) {
        var current_day = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

        var matrix = CalendarDate.getMonthMatrix(year, month_index);

        var tbody = document.createElement('div');
        var inactive_td_collection = [];
        var current_td = null;
        var current_date_td = null; // today
        var today = CalendarDate.getCurrentDate();
        var td_collection = [];
        var row_collection = [];

        for (var j = 0; j < matrix.length; j++) {
            var row = document.createElement('div');
            row_collection.push(row);
            tbody.appendChild(row);
            for (var k = 0; k < matrix[j].length; k++) {
                var td = document.createElement('div');
                if (matrix[j][k] === null) {
                    inactive_td_collection.push(td);
                } else {
                    td.innerHTML = matrix[j][k];
                    td_collection.push(td);
                    if (current_day !== null && matrix[j][k] == current_day) {
                        current_td = td;
                    }
                    if (today.year === year && today.monthIndex === month_index && today.day === matrix[j][k]) {
                        current_date_td = td;
                    }
                }
                row.appendChild(td);
            }
        }

        return {
            tbody: tbody,
            rowCollection: row_collection,
            tdCollection: td_collection,
            inactiveTdCollection: inactive_td_collection,
            currentTd: current_td,
            currentDateTd: current_date_td
        };
    },

    createEmptyTable: function createEmptyTable() {
        var table = document.createElement('div');
        return table;
    },

    createPrevButton: function createPrevButton() {
        var content = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

        var el = document.createElement('div');
        el.innerHTML = content;
        return el;
    },

    createNextButton: function createNextButton() {
        var content = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

        var el = document.createElement('div');
        el.innerHTML = content;
        return el;
    },

    createMonthSelect: function createMonthSelect() {
        var selected_month_index = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

        var select = document.createElement('select');
        for (var month_index = 0; month_index < this.lang.months.length; month_index++) {
            var option = document.createElement('option');
            option.setAttribute('value', month_index);
            option.innerHTML = this.lang.months[month_index];
            if (month_index == selected_month_index) {
                option.setAttribute('selected', 1);
            }
            select.appendChild(option);
        }
        return select;
    },

    createYearSelect: function createYearSelect() {
        var selected_year = arguments.length <= 0 || arguments[0] === undefined ? 2000 : arguments[0];
        var min_year = arguments.length <= 1 || arguments[1] === undefined ? 1950 : arguments[1];
        var max_year = arguments.length <= 2 || arguments[2] === undefined ? 2050 : arguments[2];

        var select = document.createElement('select');
        for (var i = min_year; i <= max_year; i++) {
            var option = document.createElement('option');
            option.setAttribute('value', i);
            option.innerHTML = i;
            if (i == selected_year) {
                option.setAttribute('selected', true);
            }
            select.appendChild(option);
        }
        return select;
    },

    createEmptyHeader: function createEmptyHeader() {
        var header = document.createElement('header');
        return header;
    },

    createEmptyCalendar: function createEmptyCalendar() {
        var calendar = document.createElement('calendar');
        return calendar;
    }
};

var CalendarDecorator = {
    theme: {
        def: {
            classPrefix: 'bny-',

            calendarClass: 'cal', // main container in which header and month table located
            headerClass: 'cal-header', // main header section containing prev, month, year, next
            monthClass: 'cal-month',
            yearClass: 'cal-year',
            prevButtonClass: 'cal-prev',
            nextButtonClass: 'cal-next',

            tableClass: 'cal-table', // main table section containing th of mon-sun and month days
            tableHeadClass: 'cal-head',
            tableHeadDayOfWeekClass: 'cal-day-of-week',
            tableBodyClass: 'cal-body',
            tableRowClass: 'cal-row',
            weekClass: 'cal-week',
            dayClass: 'cal-day',
            dayInactiveClass: 'cal-day-inactive', // if month day belongs to prev/next month
            dayCurrentClass: 'cal-day-current', // currently selected day
            currentDateClass: 'cal-day-today',

            popupClass: 'cal-popup',
            popupBodyFadeClass: 'cal-popup-body-fade'
        }
    },

    buildClass: function buildClass(classProperty) {
        var theme = arguments.length <= 1 || arguments[1] === undefined ? 'def' : arguments[1];

        return this.theme[theme].classPrefix + this.theme[theme][classProperty + 'Class'];
    },

    decorateTableHead: function decorateTableHead(thead, row, th_collection) {
        thead.classList.add(this.buildClass('tableHead'));
        row.classList.add(this.buildClass('tableRow'));
        for (var k = 0; k < th_collection.length; k++) {
            th_collection[k].classList.add(this.buildClass('tableHeadDayOfWeek'));
        }
    },

    decorateTableBody: function decorateTableBody(tbody, row_collection, td_collection, inactive_td_collection, current_td, current_date_td) {
        tbody.classList.add(this.buildClass('tableBody'));
        for (var k = 0; k < row_collection.length; k++) {
            row_collection[k].classList.add(this.buildClass('tableRow'));
            row_collection[k].classList.add(this.buildClass('week'));
        }
        for (k = 0; k < td_collection.length; k++) {
            td_collection[k].classList.add(this.buildClass('day'));
        }
        for (k = 0; k < inactive_td_collection.length; k++) {
            inactive_td_collection[k].classList.add(this.buildClass('dayInactive'));
        }
        if (current_td !== null) {
            current_td.classList.add(this.buildClass('dayCurrent'));
        }
        if (current_date_td !== null) {
            current_date_td.classList.add(this.buildClass('currentDate'));
        }
    },

    setCurrentDay: function setCurrentDay(td_collection, day) {
        for (var k = 0; k < td_collection.length; k++) {
            if (td_collection[k].innerHTML == day) {
                td_collection[k].classList.add(this.buildClass('dayCurrent'));
            } else if (td_collection[k].classList.contains(this.buildClass('dayCurrent'))) {
                td_collection[k].classList.remove(this.buildClass('dayCurrent'));
            }
        }
    },

    decorateTable: function decorateTable(table) {
        table.classList.add(this.buildClass('table'));
    },

    decoratePrevButton: function decoratePrevButton(prev_button) {
        prev_button.classList.add(this.buildClass('prevButton'));
    },

    decorateNextButton: function decorateNextButton(next_button) {
        next_button.classList.add(this.buildClass('nextButton'));
    },

    decorateMonthSelect: function decorateMonthSelect(select) {
        select.classList.add(this.buildClass('month'));
    },

    decorateYearSelect: function decorateYearSelect(select) {
        select.classList.add(this.buildClass('year'));
    },

    decorateHeader: function decorateHeader(header) {
        header.classList.add(this.buildClass('header'));
    },

    decorateCalendar: function decorateCalendar(calendar) {
        calendar.classList.add(this.buildClass('calendar'));
    },

    decorateCalendarPopup: function decorateCalendarPopup(calendar) {
        calendar.classList.add(this.buildClass('popup'));
        document.body.classList.add(this.buildClass('popupBodyFade'));
    },
    undecorateCalendarPopup: function undecorateCalendarPopup(calendar) {
        calendar.classList.remove(this.buildClass('popup'));
        document.body.classList.remove(this.buildClass('popupBodyFade'));
    }
};

var CalendarController = {

    attachDayClickEvent: function attachDayClickEvent(calendar_id) {
        var td_collection = Calendar._calendars[calendar_id].tableBody.tdCollection;
        for (var k = 0; k < td_collection.length; k++) {
            td_collection[k].addEventListener('click', function () {
                Calendar.pickDay(calendar_id, Calendar._calendars[calendar_id].displayedYear, Calendar._calendars[calendar_id].displayedMonthIndex, this.innerHTML);
            });
        }
    },

    attachMonthSelectEvent: function attachMonthSelectEvent(calendar_id) {
        Calendar._calendars[calendar_id].headerMonthSelect.addEventListener('change', function () {
            Calendar.changeMonth(calendar_id, Calendar._calendars[calendar_id].displayedYear, this.value);
        });
    },

    attachYearSelectEvent: function attachYearSelectEvent(calendar_id) {
        Calendar._calendars[calendar_id].headerYearSelect.addEventListener('change', function () {
            Calendar.changeMonth(calendar_id, this.value, Calendar._calendars[calendar_id].displayedMonthIndex);
        });
    },

    attachPrevClickEvent: function attachPrevClickEvent(calendar_id) {
        Calendar._calendars[calendar_id].headerPrevButton.addEventListener('click', function () {
            if (Calendar._calendars[calendar_id].displayedMonthIndex === 0) {
                Calendar.changeMonth(calendar_id, Calendar._calendars[calendar_id].displayedYear - 1, 11);
            } else {
                Calendar.changeMonth(calendar_id, Calendar._calendars[calendar_id].displayedYear, Calendar._calendars[calendar_id].displayedMonthIndex - 1);
            }
        });
    },

    attachNextClickEvent: function attachNextClickEvent(calendar_id) {
        Calendar._calendars[calendar_id].headerNextButton.addEventListener('click', function () {
            if (Calendar._calendars[calendar_id].displayedMonthIndex === 11) {
                Calendar.changeMonth(calendar_id, Calendar._calendars[calendar_id].displayedYear + 1, 0);
            } else {
                Calendar.changeMonth(calendar_id, Calendar._calendars[calendar_id].displayedYear, Calendar._calendars[calendar_id].displayedMonthIndex + 1);
            }
        });
    },

    attachCloseOnOutsideClickEvent: function attachCloseOnOutsideClickEvent(calendar_id) {
        document.addEventListener('click', function () {
            if (!Calendar.isHidden(calendar_id)) {
                Calendar.hide(calendar_id);
            }
        });

        Calendar.getCalendar(calendar_id).addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }

};

var Calendar = {

    _calendars: {},

    create: function create() {
        var id = arguments.length <= 0 || arguments[0] === undefined ? 'datepicker' : arguments[0];
        var min_year = arguments.length <= 1 || arguments[1] === undefined ? 1950 : arguments[1];
        var max_year = arguments.length <= 2 || arguments[2] === undefined ? 2050 : arguments[2];
        var year = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];
        var month_index = arguments.length <= 4 || arguments[4] === undefined ? null : arguments[4];
        var day = arguments.length <= 5 || arguments[5] === undefined ? null : arguments[5];

        var current_date = CalendarDate.getCurrentDate();

        if (year === null) {
            year = current_date.year;
        }
        if (month_index === null) {
            month_index = current_date.monthIndex;
        }
        if (day === null) {
            day = current_date.day;
        }

        var calendar = CalendarMarkup.createEmptyCalendar();
        CalendarDecorator.decorateCalendar(calendar);

        var header = CalendarMarkup.createEmptyHeader();
        CalendarDecorator.decorateHeader(header);

        var header_prev_btn = CalendarMarkup.createPrevButton();
        CalendarDecorator.decoratePrevButton(header_prev_btn);

        var header_next_btn = CalendarMarkup.createNextButton();
        CalendarDecorator.decorateNextButton(header_next_btn);

        var header_month_select = CalendarMarkup.createMonthSelect(month_index);
        CalendarDecorator.decorateMonthSelect(header_month_select);

        var header_year_select = CalendarMarkup.createYearSelect(year, min_year, max_year);
        CalendarDecorator.decorateYearSelect(header_year_select);

        header.appendChild(header_prev_btn);
        header.appendChild(header_month_select);
        header.appendChild(header_year_select);
        header.appendChild(header_next_btn);

        var table = CalendarMarkup.createEmptyTable();
        CalendarDecorator.decorateTable(table);

        var table_head = CalendarMarkup.createTableHead();
        CalendarDecorator.decorateTableHead(table_head.thead, table_head.row, table_head.thCollection);

        var table_body = CalendarMarkup.createTableBody(year, month_index, day);
        CalendarDecorator.decorateTableBody(table_body.tbody, table_body.rowCollection, table_body.tdCollection, table_body.inactiveTdCollection, table_body.currentTd, table_body.currentDateTd);

        table.appendChild(table_head.thead);
        table.appendChild(table_body.tbody);

        calendar.appendChild(header);
        calendar.appendChild(table);

        this._calendars[id] = {
            selectedYear: year,
            selectedMonthIndex: month_index,
            selectedDay: day,
            displayedYear: year,
            displayedMonthIndex: month_index,
            minYear: min_year,
            maxYear: max_year,
            calendar: calendar,
            header: header,
            headerPrevButton: header_prev_btn,
            headerMonthSelect: header_month_select,
            headerYearSelect: header_year_select,
            headerNextButton: header_next_btn,
            table: table,
            tableHead: table_head,
            tableBody: table_body,
            onPickHandlers: []
        };

        CalendarController.attachPrevClickEvent(id);
        CalendarController.attachNextClickEvent(id);

        CalendarController.attachMonthSelectEvent(id);
        CalendarController.attachYearSelectEvent(id);

        CalendarController.attachDayClickEvent(id);

        CalendarController.attachCloseOnOutsideClickEvent(id);

        return calendar;
    },

    changeMonth: function changeMonth(calendar_id, year, month_index) {
        var cal = this._calendars[calendar_id];
        if (year < cal.minYear || year > cal.maxYear) {
            return false;
        }
        var current_day = null;
        if (year == cal.selectedYear && month_index == cal.selectedMonthIndex) {
            current_day = cal.selectedDay;
        }
        cal.displayedYear = year;
        cal.displayedMonthIndex = month_index;
        var table_body = CalendarMarkup.createTableBody(year, month_index, current_day);
        CalendarDecorator.decorateTableBody(table_body.tbody, table_body.rowCollection, table_body.tdCollection, table_body.inactiveTdCollection, table_body.currentTd, table_body.currentDateTd);

        cal.tableBody.tbody.parentNode.removeChild(cal.tableBody.tbody);
        cal.tableBody = table_body;
        cal.table.appendChild(table_body.tbody);

        cal.headerYearSelect.querySelector('option[selected]').removeAttribute('selected');
        cal.headerYearSelect.querySelector('option[value="' + year + '"]').setAttribute('selected', 'selected');
        cal.headerYearSelect.value = year;

        cal.headerMonthSelect.querySelector('option[selected]').removeAttribute('selected');
        cal.headerMonthSelect.options[month_index].setAttribute('selected', 'selected');
        cal.headerMonthSelect.value = month_index;

        CalendarController.attachDayClickEvent(calendar_id);
    },

    pickDay: function pickDay(calendar_id, year, month_index, day) {
        this._calendars[calendar_id].selectedYear = year;
        this._calendars[calendar_id].selectedMonthIndex = month_index;
        this._calendars[calendar_id].selectedDay = day;
        CalendarDecorator.setCurrentDay(this._calendars[calendar_id].tableBody.tdCollection, day);
        for (var i = 0; i < this._calendars[calendar_id].onPickHandlers.length; i++) {
            var month = parseInt(month_index) + 1;
            var year = parseInt(year);
            var day = parseInt(day);
            this._calendars[calendar_id].onPickHandlers[i](year, month, day);
        }
    },

    onPick: function onPick(calendar_id, handler) {
        this._calendars[calendar_id].onPickHandlers.push(handler);
    },

    getCalendar: function getCalendar(calendar_id) {
        return this._calendars[calendar_id].calendar;
    },

    show: function show(calendar_id) {
        var popup = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        if (popup) {
            CalendarDecorator.decorateCalendarPopup(this._calendars[calendar_id].calendar);
        }
        this._calendars[calendar_id].calendar.classList.remove('hidden');
    },

    hide: function hide(calendar_id) {
        var popup = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        if (popup) {
            CalendarDecorator.undecorateCalendarPopup(this._calendars[calendar_id].calendar);
        }
        this._calendars[calendar_id].calendar.classList.add('hidden');
    },

    isHidden: function isHidden(calendar_id) {
        return this._calendars[calendar_id].calendar.classList.contains('hidden');
    }
};

var DatePicker = {

    _pickers: {},
    _options: {
        minYear: 1950,
        maxYear: 2050,
        popup: false,
        onlyAsNativeFallback: true
        //displayFormat: 'd.m.Y',
        //storeFormat: 'Y-m-d'
    },

    /**
     *
     * @param {string} input_id
     * @param {object} options
     */
    create: function create(input_id) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        for (var k in this._options) {
            if (options[k] === undefined) options[k] = this._options[k];
        }

        if (options.onlyAsNativeFallback && this.isNativeDatePickerSupported()) {
            return 2;
        }

        var self = this;
        var input = document.getElementById(input_id);
        var input_name = input.name;
        input.id = '_' + input_id;
        input.name = '_' + input_name;
        var hidden_input = document.createElement('input');
        hidden_input.id = input_id;
        hidden_input.name = input_name;
        hidden_input.type = 'hidden';
        input.parentNode.insertBefore(hidden_input, input.nextSibling);

        var calendar_id = input_id + '_calendar';
        console.log(hidden_input.value);
        if (input.value !== '') {
            hidden_input.value = self.getSqlDateFromEuropeanDate(input.value);
            var date_parts = this.getDatePartsFromISODate(hidden_input.value);
            console.log(date_parts);
            Calendar.create(calendar_id, options.minYear, options.maxYear, date_parts.year, date_parts.monthIndex, date_parts.day);
        } else {
            Calendar.create(calendar_id, options.minYear, options.maxYear);
        }

        Calendar.hide(calendar_id, options.popup);

        Calendar.onPick(calendar_id, function (year, month, day) {
            hidden_input.value = self.getSqlDateFromDateParts(year, month - 1, day);
            input.value = self.getEuropeanDateFromDateParts(year, month - 1, day);
            Calendar.hide(calendar_id, options.popup);
        });

        input.addEventListener('focus', function () {
            Calendar.show(calendar_id, options.popup);
        });

        input.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        input.parentNode.insertBefore(Calendar.getCalendar(calendar_id), input.nextSibling);

        this._pickers[input_id] = {
            input: input,
            options: options
        };

        return 1;
    },
    twoDigits: function twoDigits(num) {
        if (num < 10) {
            return '0' + num;
        }
        return num;
    },
    getDatePartsFromISODate: function getDatePartsFromISODate(iso_date_str) {
        var date = new Date(iso_date_str);
        return {
            year: date.getUTCFullYear(),
            monthIndex: date.getUTCMonth(),
            month: date.getUTCMonth() + 1,
            monthStr: this.twoDigits(date.getUTCMonth() + 1),
            day: date.getUTCDate(),
            dayStr: this.twoDigits(date.getUTCDate())
        };
    },
    getISODateFromDateParts: function getISODateFromDateParts(year, month_index, day) {
        var month = parseInt(month_index) + 1;
        var _month = this.twoDigits(month);
        var _day = this.twoDigits(day);
        return year + '-' + _month + '-' + _day;
    },
    getSqlDateFromISODate: function getSqlDateFromISODate(iso_date_str) {
        return iso_date_str;
    },
    getSqlDateFromDateParts: function getSqlDateFromDateParts(year, month_index, day) {
        return this.getISODateFromDateParts(year, month_index, day);
    },
    getSqlDateFromEuropeanDate: function getSqlDateFromEuropeanDate(eu_date) {
        if (/\d{2}(\.)\d{2}(\.)\d{4}/.test(eu_date)) {
            var parts = eu_date.split('.');
            return parts[2] + '-' + parts[1] + '-' + parts[0];
        } else {
            return '';
        }
    },
    getEuropeanDateFromSqlDate: function getEuropeanDateFromSqlDate(sql_date) {
        if (/\d{4}(\-)\d{2}(\-)\d{2}/.test(sql_date)) {
            var parts = sql_date.split('-');
            return parts[2] + '.' + parts[1] + '.' + parts[0];
        } else {
            return '';
        }
    },
    getEuropeanDateFromISODate: function getEuropeanDateFromISODate(iso_date_str) {
        var parts = this.getDatePartsFromISODate(iso_date_str);
        return parts.dayStr + '.' + parts.monthStr + '.' + parts.year;
    },
    getEuropeanDateFromDateParts: function getEuropeanDateFromDateParts(year, month_index, day) {
        var month = parseInt(month_index) + 1;
        var _month = this.twoDigits(month);
        var _day = this.twoDigits(day);
        return _day + '.' + _month + '.' + year;
    },
    isNativeDatePickerSupported: function isNativeDatePickerSupported() {
        var input = document.createElement('input');
        input.setAttribute('type', 'date');
        var notADateValue = 'not-a-date';
        input.setAttribute('value', notADateValue);
        return input.value !== notADateValue;
    }
};

DatePicker.create('datepicker');