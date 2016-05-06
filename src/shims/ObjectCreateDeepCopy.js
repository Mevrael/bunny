
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

        if(!proto[property_name] || typeof proto[property_name] !== "object" || Object.prototype.toString.call(proto[property_name]) === "[object Function]") {
            // null, undefined, any non-object, or function
            o[property_name] = proto[property_name];// anything
        } else if (proto[property_name].nodeType && "cloneNode" in proto[property_name]){
            // DOM Node
            o[property_name] = proto[property_name];
        } else if(proto[property_name] instanceof Date){
            // Date
            o[property_name] = new Date(proto[property_name].getTime());
        } else if(proto[property_name] instanceof RegExp){
            // RegExp
            o[property_name] = new RegExp(proto[property_name]);
        } else if (typeof proto[property_name] === 'object') {
            // generic objects
            o[property_name] = Object.create(proto[property_name]);
        } else {
            // not an object, just copy value
            o[property_name] = proto[property_name];
        }
    }
    if (propertiesObject !== null) {
        Object.defineProperties(o, propertiesObject);
    }
    return o;
};
