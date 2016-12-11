
import { DataTable } from '../DataTable';
import { BunnyElement } from '../BunnyElement';

Object.assign(DataTable, {
  initScrollTop(datatable) {
    this.onRedraw(datatable, (res, err) => {
      BunnyElement.scrollTo(datatable, 500, -100);
    });
  }
});
