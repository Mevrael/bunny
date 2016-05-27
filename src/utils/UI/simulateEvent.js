
export default function simulateEvent(el, event_name, event_properties = {}) {
    var eventObj = document.createEventObject ?
        document.createEventObject() : document.createEvent("Events");

    if(eventObj.initEvent){
        eventObj.initEvent(event_name, true, true);
    }

    for (let k = 0; k < event_properties.length; k++) {
        eventObj[k] = event_properties[k];
    }

    el.dispatchEvent ? el.dispatchEvent(eventObj) : el.fireEvent('on' + event_name, eventObj);

}
