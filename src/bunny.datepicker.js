
import { Calendar } from './bunny.calendar';

export var DatePicker = {

    _pickers: {},
    _options: {
        minYear: 1950,
        maxYear: 2050
        //displayFormat: 'd.m.Y',
        //storeFormat: 'Y-m-d'
    },

    /**
     *
     * @param {string} input_id
     * @param {object} options
     */
    create(input_id, options = {}) {

        for (var k in this._options) {
            if (options[k] === undefined)
                options[k] = this._options[k];
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
        hidden_input.value = input.value;
        input.parentNode.insertBefore(hidden_input, input.nextSibling);

        var calendar_id = input_id + '_calendar';
        if (input.value != '') {
            var date_parts = this.getDatePartsFromISODate(input.value);
            Calendar.create(calendar_id, options.minYear, options.maxYear, date_parts.year, date_parts.monthIndex, date_parts.day);
        } else {
            Calendar.create(calendar_id, options.minYear, options.maxYear);
        }

        if (input.value != '') {
            input.value = this.getEuropeanDateFromISODate(input.value);
        }

        Calendar.hide(calendar_id);

        Calendar.onPick(calendar_id, function(year, month, day) {
            hidden_input.value = self.getSqlDateFromDateParts(year, month-1, day);
            input.value = self.getEuropeanDateFromDateParts(year, month-1, day);
            Calendar.hide(calendar_id);
        });

        input.addEventListener('focus', function() {
            Calendar.show(calendar_id);
        });

        input.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        input.parentNode.insertBefore(Calendar.getCalendar(calendar_id), input.nextSibling);

        this._pickers[input_id] = {
            input: input
        }
    },

    twoDigits(num) {
        if (num < 10) {
            return '0' + num;
        }
        return num;
    },

    getDatePartsFromISODate(iso_date_str) {
        var date = new Date(iso_date_str);
        return {
            year: date.getUTCFullYear(),
            monthIndex: date.getUTCMonth(),
            month: date.getUTCMonth() + 1,
            monthStr: this.twoDigits(date.getUTCMonth() + 1),
            day: date.getUTCDate(),
            dayStr: this.twoDigits(date.getUTCDate())
        }
    },

    getISODateFromDateParts(year, month_index, day) {
        var month = parseInt(month_index) + 1;
        var _month = this.twoDigits(month);
        var _day = this.twoDigits(day);
        return year + '-' + _month + '-' + _day;
    },

    getSqlDateFromISODate(iso_date_str) {
        return iso_date_str;
    },

    getSqlDateFromDateParts(year, month_index, day) {
        return this.getISODateFromDateParts(year, month_index, day);
    },

    getEuropeanDateFromISODate(iso_date_str) {
        var parts = this.getDatePartsFromISODate(iso_date_str);
        return parts.dayStr + '.' + parts.monthStr + '.' + parts.year;
    },

    getEuropeanDateFromDateParts(year, month_index, day) {
        var month = parseInt(month_index) + 1;
        var _month = this.twoDigits(month);
        var _day = this.twoDigits(day);
        return _day + '.' + _month + '.' + year;
    }
};
