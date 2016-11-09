
import '../../src/polyfills/Promise';

import { Dropdown } from '../../src/Dropdown';

import { Autocomplete } from '../../src/Autocomplete';

import '../../src/CustomSelect';

import { Country } from './CountryModel';

Autocomplete.onItemSelect(document.getElementsByTagName('autocomplete')[0], (id, label) => {
    if (id !== null) {
        document.getElementById('current').textContent = id;
    } else {
        document.getElementById('current').textContent = '';
    }
});

const dropdown = document.getElementById('dropdown1');
Dropdown.onItemSelect(dropdown, (item) => {
  console.log('item clicked', item);
});

Dropdown.onClickOutside(dropdown, () => {
  console.log('clicked outside');
});

Dropdown.onItemSwitched(dropdown, (item) => {
  console.log('item switched', item);
});

const cs = document.getElementById('customselect1');
const classNames = Array.from(Dropdown.UI.getMenuItems(cs)).map(item => item.dataset.class);
Dropdown.onItemSelect(cs, (item) => {
  classNames.forEach(className => {
    cs.classList.remove(className);
  });
  const className = item.dataset.class;
  cs.classList.add(className);
});

