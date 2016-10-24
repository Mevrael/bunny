
import '../../src/polyfills/Promise';

import { Autocomplete } from '../../src/Autocomplete';

import '../../src/CustomSelect';

import './CountryModel';

Autocomplete.onItemSelect(document.getElementsByTagName('autocomplete')[0], (id, label) => {
    if (id !== null) {
        document.getElementById('current').textContent = id;
    } else {
        document.getElementById('current').textContent = '';
    }
});

