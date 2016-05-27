
import '../../constants/keycodes';

import simulateKeydown from './simulateKeydown';

export default function simulateGoogleAutocompleteSelect(input, value) {
    input.value = value;

    setTimeout( () => {
        input.focus();
        setTimeout( () => {
            simulateKeydown(input, KEY_ARROW_DOWN);
            simulateKeydown(input, KEY_ENTER);
        }, 0)
    }, 700);
}
