
import simulateEvent from './simulateEvent';

export default function simulateKeydown(el, keyCode) {
    const event_names = ['keydown', 'keypress, keyup'];
    const event_properties = {
        keyCode: keyCode,
        which: keyCode
    };
    event_names.forEach( event_name => {
        simulateEvent(el, event_name, event_properties);
    })
}
