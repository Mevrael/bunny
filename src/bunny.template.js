'use strict'

export const TEMPLATE_EVENT_INIT = 'init';
export const TEMPLATE_EVENT_FORMAT_DATA = 'format_data';

/**
 * Base object Template
 */
export var Template = {

    _loadedTemplates: [],
    _dataVarName: 'v',
    _dataAttrVarName: 'av',

    define: function(id, handlers = {}, events = {})
    {
        if (this._loadedTemplates[id] === undefined) {
            var e = document.getElementById(id);
            if (e === null) {
                console.error('Template with id="'+id+'" doesn\'t exists');
                return false;
            }
            var f = document.createDocumentFragment();
            var sub = null;
            if (e.tagName === 'TABLE') {
                sub = e.querySelector('tbody')
            } else {
                sub = e;
            }
            while (sub.firstChild) {
                f.appendChild(sub.firstChild);
            }
            this._loadedTemplates[id] = {
                templateFragment: f,
                handlers: handlers,
                events: events,
                isTable: (e.tagName === 'TABLE')
            };
        } else {
            console.error('Template with id="'+id+'" already defined!');
            return false;
        }
        return true;
    },

    isTable: function(tpl_id) {
        return this._loadedTemplates[tpl_id].isTable;
    },

    create: function(id, related_data) {
        var t = {};
        var attr_parts = [];
        var data_var_name = this._dataVarName;
        var attr_data_var_name = this._dataAttrVarName;
        if (this._loadedTemplates[id] === undefined) {
            console.error('Template with id="' + id + '" is not defined. Use Template.define() first.');
            return false;
        }
        t.id = id;
        t.content = this._loadedTemplates[id].templateFragment.cloneNode(true);
        t.nodes = [].slice.call(t.content.childNodes, 0);
        t.isTable = (this._loadedTemplates[id].tagName === 'TABLE');

        t.varElements = [];
        [].forEach.call(t.content.querySelectorAll('[' + data_var_name + ']'), function (e) {
            t.varElements[e.getAttribute(data_var_name)] = e;
        });

        t.attrVarElements = [];
        [].forEach.call(t.content.querySelectorAll('[' + attr_data_var_name + ']'), function (e) {
            attr_parts = e.getAttribute(attr_data_var_name).split(':');
            t.attrVarElements[attr_parts[1]] = {
                el: e,
                attr: attr_parts[0]
            };
        });

        //t.attributeReplaceElements = [];
        // value attribute
        /*this.addAttributeReplaceElement('value', t);
        this.addAttributeReplaceElement('datetime', t);
        this.addAttributeReplaceElement('data-id', t);
        this.addAttributeReplaceElement('src', t);*/

        t.handlerElements = [];
        [].forEach.call(t.content.querySelectorAll('[data-handler]'), function (e) {
            t.handlerElements.push(e);
        });

        if (related_data !== undefined) {
            t.relatedData = related_data;
        }
        return t;
    },

    /*addAttributeReplaceElement: function(attribute_name, tpl) {
        tpl.content.querySelectorAll('['+attribute_name+'^="$"]').forEach(function (e) {
            tpl.attributeReplaceElements[e.getAttribute(attribute_name)] = {
                attribute: attribute_name,
                element: e
            };
        });
    },*/

    parse: function(data, tpl) {
        var t = Object.create(tpl);
        if (data === undefined || data === null) {
            data = [];
        } else if (typeof data !== 'object') {
            console.error('1st argument of Template.parse() - "data" must be an array or object.');
            return false;
        }

        if (this._loadedTemplates[t.id].events[TEMPLATE_EVENT_FORMAT_DATA] !== undefined) {
            data = this._loadedTemplates[t.id].events[TEMPLATE_EVENT_FORMAT_DATA](data, t.relatedData);
        }

        t.escapedData = [];

        for (var d in data) {
            t.escapedData[d] = this.nl2br(this.escape(data[d]));
            if (t.varElements[d] !== undefined) {
                t.varElements[d].innerHTML = t.escapedData[d];
            }
            if (t.attrVarElements[d] !== undefined) {
                t.attrVarElements[d].el.setAttribute(t.attrVarElements[d].attr, data[d]);
            }
            /*if (t.attributeReplaceElements['$'+d] !== undefined) {
                t.attributeReplaceElements['$'+d].element.setAttribute(t.attributeReplaceElements['$'+d].attribute, t.escapedData[d]);
            }*/
        }
        return t;
    },

    escape: function(str) {
        return String(str).replace(/&amp;/g, '&').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    nl2br: function(str) {
        return String(str).replace(/(\n)+/g, '<br>');
    },

    callHandlers: function(tpl) {
        for (var h in tpl.handlerElements) {
            var f = this._loadedTemplates[tpl.id].handlers[tpl.handlerElements[h].getAttribute('data-handler')];
            if (f === undefined) {
                console.error('Template\'s "'+tpl.id+'" handler "'+f+'" does not exists. Pass second argument to Template.define() as object where keys=handler names.');
                return false;
            }
            f(tpl.handlerElements[h], tpl.escapedData, tpl.nodes);
        }
    },

    append: function (tpl, parent_el) {
        if (parent_el === null || parent_el === undefined) {
            console.error('Unable to append template to parent element. Passed as 2nd argument to Template.append(). parent_el is: ' + parent_el);
            return false;
        }
        var el_to_append = null;
        if (this.isTable(tpl.id)) {
            el_to_append = parent_el.querySelector('tbody');
        } else {
            el_to_append = parent_el;
        }
        el_to_append.appendChild(tpl.content);
        this.callHandlers(tpl);
        return tpl.nodes;
    },

    insert: function(tpl_id, data, parent_el) {
        return this.append(this.parse(data, this.create(tpl_id)), parent_el);
    },

    insertAll: function(tpl_id, data_collection, parent_el) {
        var f = document.createDocumentFragment();
        var tpl_collection = [];
        for (var k=0; k<data_collection.length; k++) {
            var tpl = this.create(tpl_id);
            tpl = this.parse(data_collection[k], tpl);
            f.appendChild(tpl.content);
            tpl_collection.push(tpl);
        }
        var el_to_append = null;
        if (this.isTable(tpl_id)) {
            el_to_append = parent_el.querySelector('tbody');
        } else {
            el_to_append = parent_el;
        }
        el_to_append.appendChild(f);
        for (k=0; k<tpl_collection.length; k++) {
            this.callHandlers(tpl_collection[k]);
        }
    },

    insertAdjacencyList: function(tpl_id, data_adj_list, parent_el, parent_id_column, branch_container_class, order) {

        if (parent_id_column === undefined || parent_id_column === null) {
            parent_id_column = 'parent_id';
        }

        if (order === undefined || order === null || (order !== 'asc' && order !== 'desc')) {
            order = 'asc'
        }

        // transform adjacency list
        var data = {
            _0: {}
        };
        data['_0']._rendered = false;
        data['_0'].id = 0;
        for (var k in data_adj_list) {
            // prepend _ before id because JavaScript will break an original data order
            data['_'+data_adj_list[k].id] = data_adj_list[k];
            data['_'+data_adj_list[k].id]._rendered = false;
        }
        for (var k in data_adj_list) {
            var p = data['_'+data_adj_list[k].id][parent_id_column];
            if (data['_'+p]._children_ids === undefined) {
                data['_'+p]._children_ids = [];
            }
            data['_'+p]._children_ids.push(data_adj_list[k].id);
        }
        // end transform

        var f = document.createDocumentFragment();
        var tpl_collection = [];

        var append_node = function(node, where) {
            if (node._rendered === false) {
                node._rendered = true;
                if (node.id === 0) {
                    for (var i in node._children_ids) {
                        append_node(data['_'+node._children_ids[i]], where);
                    }
                } else {
                    var related_data = build_related_data(node);
                    var tpl = Template.create(tpl_id, related_data);
                    tpl = Template.parse(node, tpl);
                    tpl_collection.push(tpl);
                    if (node._children_ids !== undefined) {
                        for (var i in node._children_ids) {
                            if (tpl.content.querySelector('.'+branch_container_class) === null) {
                                console.error('Element inside template with class "'+branch_container_class+'" not found. Passed in as 5th argument in Template.insertAdjacencyList() - "branch_container_class"')
                            }
                            append_node(data['_'+node._children_ids[i]], tpl.content.querySelector('.'+branch_container_class));
                        }
                    }
                    where.appendChild(tpl.content);
                }
            }
        };

        var build_related_data = function(node) {
            if (node.parent_id > 0) {
                var related_data = {};
                related_data = data['_'+node.parent_id];
                if (data['_'+node.parent_id].parent_id > 0) {
                    related_data.parent = build_related_data(data['_'+node.parent_id]);
                }
                return related_data;
            }
            return undefined;
        };

        append_node(data['_0'], f);

        parent_el.appendChild(f);

        for (k=0; k<tpl_collection.length; k++) {
            this.callHandlers(tpl_collection[k]);
        }
    }
};

/*document.addEventListener('DOMContentLoaded', function() {

    /!**
     * Insert templates on page load if there are data-template attributes on any elements
     *!/
    document.querySelectorAll('[data-template]').forEach(function(e) {
        var tpl_id = e.getAttribute('data-template');
        var data = [];
        if (Template._loadedTemplates[tpl_id].events[TEMPLATE_EVENT_INIT] !== undefined) {
            data = Template._loadedTemplates[tpl_id].events[TEMPLATE_EVENT_INIT]();
        }
        Template.insert(tpl_id, data, e)
    });

}, false);*/
