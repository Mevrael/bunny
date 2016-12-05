
import { Autocomplete, AutocompleteConfig, AutocompleteUI} from '../Autocomplete';
import { createSvgUse } from "../utils/svg";
import { Spinner } from '../Spinner';

Object.assign(AutocompleteConfig, {
  iconSearch: 'search', // default inline svg icon ID to display
});

Object.assign(AutocompleteUI, {
  getIcon(autocomplete) {
    return autocomplete.getElementsByTagName('svg')[0];
  },
  createIcon() {
    return createSvgUse(this.Config.iconSearch);
  },
  insertIcon(autocomplete, icon) {
    autocomplete.appendChild(icon);
  },
});

Object.assign(Autocomplete, {
  initIcons(autocomplete) {
    const icon = this.UI.createIcon();
    this.UI.insertIcon(autocomplete, icon);
    this.onBeforeUpdate(autocomplete, () => {
      this.showSpinner(autocomplete);
    });
    this.onUpdate(autocomplete, (res, err) => {
      this.hideSpinner(autocomplete);
    });
  },

  showSpinner(autocomplete) {
    Spinner.toggle(this.UI.getIcon(autocomplete));
  },
  hideSpinner(autocomplete) {
    Spinner.toggle(this.UI.getIcon(autocomplete));
  }
});
