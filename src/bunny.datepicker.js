
import { Calendar } from './bunny.calendar';

export var DatePicker = {

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
    create(input_id, options = {}) {

        for (var k in this._options) {
            if (options[k] === undefined)
                options[k] = this._options[k];
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
        if (input.value !== '') {
            hidden_input.value = self.getSqlDateFromEuropeanDate(input.value);
            var date_parts = this.getDatePartsFromISODate(hidden_input.value);
            Calendar.create(calendar_id, options.minYear, options.maxYear, date_parts.year, date_parts.monthIndex, date_parts.day);
        } else {
            Calendar.create(calendar_id, options.minYear, options.maxYear);
        }

        Calendar.hide(calendar_id, options.popup);

        Calendar.onPick(calendar_id, (year, month, day) => {
            hidden_input.value = self.getSqlDateFromDateParts(year, month-1, day);
            input.value = self.getEuropeanDateFromDateParts(year, month-1, day);
            Calendar.hide(calendar_id, options.popup);
        });

        input.addEventListener('focus', () => {
            Calendar.show(calendar_id, options.popup);
        });

        input.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        input.parentNode.insertBefore(Calendar.getCalendar(calendar_id), input.nextSibling);

        this._pickers[input_id] = {
            input: input,
            options: options
        };

        return 1;
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

    getSqlDateFromEuropeanDate(eu_date) {
        if (/\d{2}(\.)\d{2}(\.)\d{4}/.test(eu_date)) {
            const parts = eu_date.split('.');
            return parts[2] + '-' + parts[1] + '-' + parts[0];
        } else {
            return '';
        }
    },

    getEuropeanDateFromSqlDate(sql_date) {
        if (/\d{4}(\-)\d{2}(\-)\d{2}/.test(sql_date)) {
            const parts = sql_date.split('-');
            return parts[2] + '.' + parts[1] + '.' + parts[0];
        } else {
            return '';
        }
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
    },

    isNativeDatePickerSupported() {
        var input = document.createElement('input');
        input.setAttribute('type','date');
        var notADateValue = 'not-a-date';
        input.setAttribute('value', notADateValue);
        return (input.value !== notADateValue);
    }
};
