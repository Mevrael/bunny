'use strict'

NodeList.prototype.forEach = Array.prototype.forEach;
HTMLCollection.prototype.forEach = Array.prototype.forEach;

/**
 * Extends native Object.create() to create also properties from object properties if they are objects or arrays
 * For example,
 * var p = { obj: {one: 1, two: 2} };
 * var o = Object.create(p);
 * o.obj.one = 10; // <-- this also changed an original object's property, with this extension, it's fixed
 * @param {Object} proto
 * @param {Object} [propertiesObject]
 * @static
 * @return {Object}
 */
Object.create = function(proto, propertiesObject = null) {
    if (Array.isArray(proto)) {
        var o = [];
    } else {
        var o = {};
    }
    let properties = Object.keys(proto);
    for (let k = 0; k < properties.length; k++) {
        let property_name = properties[k];
        if (typeof proto[property_name] === 'object') {
            if (proto[property_name].nodeType && 'cloneNode' in proto[property_name]) {
                // DOM element
                o[property_name] = proto[property_name];
            } else {
                o[property_name] = Object.create(proto[property_name]);
            }
        } else {
            o[property_name] = proto[property_name];
        }
    }
    if (propertiesObject !== null) {
        Object.defineProperties(o, propertiesObject);
    }
    return o;
};
