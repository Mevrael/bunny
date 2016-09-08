
/**
 * @package BunnyJS
 * @component BunnyDate
 *
 * Wrapper around native Date object
 * Instead of new Date() use BunnyDate.create() which returns false for invalid dates
 * Create Date from SQL or convert Date to SQL string
 * Currently works only for Dates and not DateTimes
 * Using local timezone
 */
export const BunnyDate = {

    // Date object factories

    /**
     * Create Date object by year, month (1-12) and day
     * Returns false if date is invalid, for example, February 31
     *
     * @param {Number|String} year   - full year
     * @param {Number|String} month  - month number 1-12 or string including '07' etc.
     * @param {Number|String} day    - day number 1-31 or string including '07' etc.
     *
     * @returns {Date|boolean}
     */
    create(year, month, day) {
        day = parseInt(day);
        month = parseInt(month);
        year = parseInt(year);
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            return date
        }
        return false;
    },

    /**
     * Creates Date object from SQL Date string, for example, '2016-07-14'
     *
     * @param {String} sqlDate
     *
     * @returns {Date|boolean}
     */
    createFromSql(sqlDate) {
        const parts = sqlDate.split('-');
        const year = parts[0];
        const monthStr = parts[1];
        const dayStr = parts[2];
        return this.create(year, monthStr, dayStr);
    },

    /**
     * Creates Date object from European Date string, for example, '14.07.2016'
     *
     * @param {String} euDate
     *
     * @returns {Date|boolean}
     */
    createFromEu(euDate) {
        const parts = euDate.split('-');
        const dayStr = parts[0];
        const monthStr = parts[1];
        const year = parts[2];
        return this.create(year, monthStr, dayStr);
    },

    // Helpers

    /**
     * Get Date object meta object for custom methods and algorithms
     *
     * @param {Date} date
     * @returns {Object}
     */
    getMeta(date) {
        return {
            year: date.getFullYear(),
            monthIndex: date.getMonth(),
            month: date.getMonth() + 1,
            monthStr: this._twoDigits(date.getMonth() + 1),
            day: date.getDate(),
            dayStr: this._twoDigits(date.getDate())
        }
    },

    // Date object to date string converters

    /**
     * Get SQL Date string from Date object (YYYY-MM-DD)
     * @param {Date} date
     * @returns {string}
     */
    toSqlDate(date) {
        const meta = this.getMeta(date);
        return meta.year + '-' + meta.monthStr + '-' + meta.dayStr;
    },

    /**
     * Get European Date string from Date object (DD.MM.YYYY)
     * @param {Date} date
     * @returns {string}
     */
    toEuDate(date) {
        const meta = this.getMeta(date);
        return meta.dayStr + '.' + meta.monthStr + '.' + meta.year;
    },

    // private

    _twoDigits(num) {
            return (num < 10) ? '0' + num : num;
    }

};
