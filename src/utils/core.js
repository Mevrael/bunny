
export function getActionObject(element) {
    const action = element.getAttribute('action');
    const parts = action.split('.');
    const Model = parts[0];
    let actionObject = null;
    if (parts[1] === undefined) {
        actionObject = window[Model];
    } else {
        const searchAction = parts[1];
        try {
            actionObject = window[Model][searchAction];
        } catch (e) {}
    }

    if (actionObject === undefined) {
        throw new Error(`Bunny Error: Model search action specified in action="${action}" attribute not found`);
    }
    return actionObject;
}



export function pushToElementProperty(element, property, value) {
    if (element[property] === undefined) {
        element[property] = [];
    }
    element[property].push(value);
}

export function pushCallbackToElement(element, namespace, callback) {
    pushToElementProperty(element, `__bunny_${namespace}_callbacks`, callback)
}

export function callElementCallbacks(element, namespace, cb) {
    const callbacks = element[`__bunny_${namespace}_callbacks`];
    if (callbacks !== undefined) {
        callbacks.forEach(callback => {
            cb(callback);
        })
    }
}
