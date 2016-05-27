
export default function simulateEvent(el, event_name, event_properties = {}) {
    var eventObj = document.createEventObject ?
        document.createEventObject() : document.createEvent("Events");

    if(eventObj.initEvent){
        eventObj.initEvent(event_name, true, true);
    }

    for (let prop_name in event_properties) {
        eventObj[prop_name] = event_properties[prop_name];
    }

    el.dispatchEvent ? el.dispatchEvent(eventObj) : el.fireEvent('on' + event_name, eventObj);

}
