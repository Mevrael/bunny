
import { DataTable } from '../DataTable';
import { Spinner } from '../Spinner';

Object.assign(DataTable, {
  initIcons(datatable) {
    this.onBeforeRedraw(datatable, () => {
      Spinner.fadePage();
    });
    this.onRedraw(datatable, (res, err) => {
      Spinner.unfadePage();
    });
  }
});
