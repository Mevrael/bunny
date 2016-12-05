
import '../../src/polyfills/Promise';
import '../../src/polyfills/ObjectAssign';
import '../../src/polyfills/fetch';
import '../../src/polyfills/CustomEvent';
import '../../src/polyfills/SVGClassList';

import { Dropdown } from '../../src/Dropdown';
import { Autocomplete } from '../../src/Autocomplete';
import '../../src/plugins/AutocompleteIcons';
import '../../src/CustomSelect';

import './CountryModel';
import {Spinner} from "../../src/Spinner";

document.forms.f1.addEventListener('submit', (e) => {
  e.preventDefault();
  Spinner.fadePage('Creating your account').then(() => {
    setTimeout(() => {
      Spinner.setFadeText('Account created', 't-success');
      Spinner.setFadeIcon('check', 'i-check');
    }, 1000);
  });
});

const ac = document.getElementsByTagName('autocomplete')[0];

Autocomplete.onItemSelect(ac, (item) => {
  console.log('autocomplete item selected', item);
  document.getElementById('current').textContent = Autocomplete.getValue(ac);
});

Autocomplete.onCancel(ac, () => {
  console.log('autocomplete item canceled');
  document.getElementById('current').textContent = Autocomplete.getValue(ac);
});

const dropdown = document.getElementById('dropdown1');
Dropdown.onItemSelect(dropdown, (item) => {
  console.log('item clicked', item);
});

Dropdown.onCancel(dropdown, () => {
  console.log('clicked outside or pressed ESC');
});

Dropdown.onItemSwitched(dropdown, (item) => {
  console.log('item switched', item);
});

/*const cs = document.getElementById('customselect1');
const classNames = Array.from(Dropdown.UI.getMenuItems(cs)).map(item => item.dataset.class);
Dropdown.onItemSelect(cs, (item) => {
  classNames.forEach(className => {
    cs.classList.remove(className);
  });
  const className = item.dataset.class;
  cs.classList.add(className);
});*/
