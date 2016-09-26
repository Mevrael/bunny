
export const DynamicInput = {

    tagName: 'dynamicinput',

    getInputs(dynamicinput) {
        return dynamicinput.childNodes;
    },

    getAllDynamicInputs(node = document) {
        return node.getElementsByTagName(this.tagName);
    },

    init(dynamicinput) {
        const emptyInput = this.create(dynamicinput);
        dynamicinput.appendChild(emptyInput);
        this.addEvents(dynamicinput);
    },

    initAll() {
        const dynamicInputs = this.getAllDynamicInputs();
        [].forEach.call(dynamicInputs, dynamicInput => {
            this.init(dynamicInput);
        });
    },

    addEvents(dynamicinput) {
        const inputs = this.getInputs(dynamicinput);
        [].forEach.call(inputs, input => {
            this.addEvent(input, dynamicinput);
        });
    },

    addEvent(input, dynamicinput) {
        input.addEventListener('input', () => {
            if (input === dynamicinput.lastChild) {
                if (input.value.length > 0) {
                    this.addInput(dynamicinput);
                } else {

                }
            } else {
                if (input.value.length === 0) {
                    this.removeInput(dynamicinput, input);
                }
            }
        });
    },

    addInput(dynamicinput) {
        const input = this.create(dynamicinput);
        dynamicinput.appendChild(input);
        this.addEvent(input, dynamicinput);
    },

    removeInput(dynamicinput, input = null) {
        if (input === null) {
            input = dynamicinput.lastChild;
        }
        dynamicinput.removeChild(input);
    },

    create(dynamicinput) {
        const attributes = Object.keys(dynamicinput.dataset);
        const input = document.createElement('input');
        [].forEach.call(attributes, attribute => {
            input.setAttribute(attribute, dynamicinput.dataset[attribute]);
        });
        return input;
    },

    clear(dynamicinput) {
        const inputs = this.getInputs(dynamicinput);
        for (let k = 0; k < inputs.length; k++) {
            if (k === 0) {
                inputs[k].value = '';
            } else {
                this.removeInput(dynamicinput, inputs[k]);
            }
        }
    }

};

document.addEventListener('DOMContentLoaded', () => {
    DynamicInput.initAll();
});
