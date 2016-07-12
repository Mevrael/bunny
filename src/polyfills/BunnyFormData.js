
import nonEnumKeys from '../utils/object/nonEnumKeys';

/**
 * FormData wrapper for browsers supporting only FormData constructor and append()
 * Instead of keys(), entries(), values() have getAllElements()
 * Instead of delete() -> remove()
 * To get real FormData object use buildFormDataObject()
 * Also adds custom methods
  */

function BunnyFormData(form) {
    if (!(form instanceof HTMLFormElement)) {
        throw new Error('Form passed to BunnyFormData constructor is not an instance of HTMLFormElement');
    }

    // form
    this._form = form;

    // form control collection;
    this._collection = {};

    // build collection from form elements
    var elements = this.getInputs();
    for (var k = 0; k < elements.length; k++) {
        var input = elements[k];
        this._initSingleInput(input);
    }
}

BunnyFormData.prototype._initSingleInput = function _initSingleInput(input) {
    const type = this.getInputType(input);

    // check if parser for specific input type exists and call it instead
    let method = type.toLowerCase();
    method = method.charAt(0).toUpperCase() + method.slice(1); // upper case first char
    method = '_formControlParser' + method;
    if (this[method] !== undefined) {
        this[method](input);
    } else {
        // call default parser
        // if input with same name exists - override
        this._formControlParserDefault(input);
    }
};






BunnyFormData.prototype._formControlParserDefault = function _formControlParserDefault(input) {
    if (this._collection[input.name] !== undefined) {
        // element with same name already exists in collection
        if (!Array.isArray(this._collection[input.name])) {
            // is not array, convert to array first
            this._collection[input.name] = [this._collection[input.name]];
        }
        this._collection[input.name].push(input.value);
    } else {
        this._collection[input.name] = input.value;
    }
};

BunnyFormData.prototype._formControlParserRadio = function _formControlParserRadio(input) {
    // radio buttons must have same name and only one can be checked
    // exactly one radio must have checked attribute
    // radio buttons must have value attribute
    if (input.checked) {
        this._collection[input.name] = input.value;
    }
};

BunnyFormData.prototype._formControlParserCheckbox = function _formControlParserCheckbox(input) {
    // checkboxes may have different names or same name if checkboxes should be an array
    // each checkbox may have checked attribute
    // checkboxes must have value attribute
    if (this._collection[input.name] === undefined) {
        // first checkbox with this name found
        if (input.checked) {
            this._collection[input.name] = input.value;
        } else {
            this._collection[input.name] = '';
        }
    } else {
        if (input.checked) {
            // checkbox with same name already exists in collection
            if (!Array.isArray(this._collection[input.name])) {
                // is not array, convert to array first
                this._collection[input.name] = [this._collection[input.name]];
            }
            this._collection[input.name].push(input.value);
        }
    }
};

BunnyFormData.prototype._formControlParserFile = function _formControlParserFile(input) {
    this._collection[input.name] = (input.files[0] === undefined || input.files[0] === null) ? '' : input.files[0];
};






// since form inputs can be accessed via form.input_name and if input_name = elements
// then form.elements will return input not FormControlsCollection
// make sure to get real FormControlsCollection from prototype
BunnyFormData.prototype.getInputs = function getInputs() {
    return Object.getOwnPropertyDescriptor(this._form.constructor.prototype, 'elements').get.call(this._form);
};

BunnyFormData.prototype.getNamedInputs = function getNamedInputs() {
    const elements = this.getInputs();
    // IE does not return correct enum keys, get keys manually
    // non numbered keys will be named keys
    //const keys = nonEnumKeys(elements);
    //console.log(keys);
    const keys = Object.getOwnPropertyNames(elements).filter(key => isNaN(key));

    let named_inputs = {};
    for (let k = 0; k < keys.length; k++) {
        let input_name = keys[k];
        named_inputs[input_name] = elements[input_name];
    }
    return named_inputs;
};

BunnyFormData.prototype.getNodeLists = function getNodeLists() {
    const elements = this.getNamedInputs();
    let node_lists = {};
    for (let input_name in elements) {
        if (this.isNodeList(input_name)) {
            node_lists[input_name] = elements[input_name];
        }
    }
    return node_lists;
};

BunnyFormData.prototype.getRadioLists = function getRadioLists() {
    const node_lists = this.getNodeLists();
    let radio_lists = {};
    for (let input_name in node_lists) {
        if (node_lists[input_name][0].type === 'radio') {
            radio_lists[input_name] = node_lists[input_name];
        }
    }
    return radio_lists;
};

BunnyFormData.prototype.getInputType = function getInputType(name_or_el) {
    let input = null;
    if (typeof name_or_el === 'object') {
        input = name_or_el;
    } else {
        input = this.getInput(name_or_el);
    }

    if (input.type !== undefined && input.type !== null && input.type !== '') {
        return input.type;
    }
    if (input.tagName === 'TEXTAREA') {
        return 'textarea';
    } else if (this.isNodeList(input)) {
        return 'radiolist';
    } else {
        return undefined;
    }
};

BunnyFormData.prototype.getInput = function getInput(name) {
    return Object.getOwnPropertyDescriptor(this._form.constructor.prototype, 'elements').get.call(this._form)[name];
};

BunnyFormData.prototype.get = function get(input_name) {
    if (this._collection[input_name] === undefined) {
        return null;
    } else {
        return this._collection[input_name];
    }
};

// value can also be a Blob/File but this get() polyfill does not include 3rd argument filename
BunnyFormData.prototype.set = function get(input_name, value) {
    this._collection[input_name] = value;
};

BunnyFormData.prototype.setCheckbox = function setArrayKey(input_name, value, checked) {
    if (this.has(input_name) && !this.empty(input_name)) {
        if (checked) {
            // add element to array if not exists
            if (!this.isArray(input_name)) {
                // convert to array first
                if (this._collection[input_name] !== value) {
                    this._collection[input_name] = [this._collection[input_name]];
                    this._collection[input_name].push(value);
                }
            } else {
                if (this._collection[input_name].indexOf(value) === -1) {
                    this._collection[input_name].push(value);
                }
            }
        } else {
            // remove element from array if exists
            if (!this.isArray(input_name)) {
                // convert to array first
                if (this._collection[input_name] === value) {
                    this._collection[input_name] = '';
                }
            } else {
                let pos = this._collection[input_name].indexOf(value)
                if (pos !== -1) {
                    if (this._collection[input_name].length === 1) {
                        this._collection[input_name] = '';
                    } else {
                        this._collection[input_name].splice(pos, 1);
                    }
                }
            }
        }
    } else {
        this._collection[input_name] = value;
    }
};

BunnyFormData.prototype.has = function has(input_name) {
    return this._collection[input_name] !== undefined;
};

BunnyFormData.prototype.empty = function has(input_name) {
    return this._collection[input_name].length === 0;
};

BunnyFormData.prototype.isArray = function isArray(input_name) {
    return Array.isArray(this._collection[input_name]);
};

BunnyFormData.prototype.isNodeList = function isNodeList(input_name_or_el) {
    const input = (typeof input_name_or_el === 'object') ? input_name_or_el : this.getInput(input_name_or_el);
    // RadioNodeList is undefined in IE, Edge, it uses HTMLCollection instead
    return input instanceof (typeof RadioNodeList !== 'undefined' ? RadioNodeList : HTMLCollection);
};

BunnyFormData.prototype.append = function append(input_name, value) {
    if (this._collection[input_name] === undefined) {
        this._collection[input_name] = value;
    } else if (Array.isArray(this._collection[input_name])) {
        this._collection[input_name].push(value);
    } else {
        // convert single element into array and append new item
        const item = this._collection[input_name];
        this._collection[input_name] = [item, value];
    }
};

BunnyFormData.prototype.getAll = function getAll(input_name) {
    if (this._collection[input_name] === undefined) {
        return [];
    } else if (Array.isArray(this._collection[input_name])) {
        return this._collection[input_name];
    } else {
        return [this._collection[input_name]];
    }
};

// since entries(), keys(), values() return Iterator which is not supported in many browsers
// there is only one element to simply get object of key => value pairs of all form elements
// use this method instead of entries(), keys() or values()
BunnyFormData.prototype.getAllElements = function getAllElements() {
    return this._collection;
};

BunnyFormData.prototype.buildFormDataObject = function buildFormDataObject() {
    const formData = new FormData();
    for (let key in this._collection) {
        if (Array.isArray(this._collection[key])) {
            this._collection[key].forEach((item) => {
                formData.append(key, item);
            });
        } else {
            formData.append(key, this._collection[key]);
        }
    }
    return formData;
};

// remove instead of delete(). Also can remove element from array
BunnyFormData.prototype.remove = function remove(input_name, array_value = undefined) {
    if (array_value !== undefined) {
        // remove element from array
        if (Array.isArray(this._collection[input_name])) {
            let new_array = [];
            this._collection[input_name].forEach((item) => {
                if (item !== array_value) {
                    new_array.push(item);
                }
            });
            this._collection[input_name] = new_array;
        } else {
            // not an array, just remove single element
            delete this._collection[input_name];
        }
    } else {
        delete this._collection[input_name];
    }
};

export default BunnyFormData;
