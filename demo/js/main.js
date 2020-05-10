import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import parse from 'date-fns/parse';
import { de } from 'date-fns/locale';

import { extractActivities } from '../../src';

new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
    activities: [],
  },
  methods: {
    showHoldingWarning(a) {
      return !a.filename && !a.holding;
    },
    getPriceColor(type) {
      if (type === 'Dividend' || type === 'Buy' || type === 'Import') {
        return 'has-text-success';
      } else {
        return 'has-text-danger';
      }
    },
    getTypeColor(type) {
      if (type === 'Dividend' || type === 'Buy' || type === 'Import') {
        return 'is-success';
      } else {
        return 'is-danger';
      }
    },
    formatDate(d) {
      return formatDistanceToNow(parse(d, 'yyyy-MM-dd', new Date()), {
        locale: de,
        addSuffix: true,
      });
    },
    numberWithCommas(x) {
      var parts = x.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return parts.join(',');
    },
    formatPrice(p = 0) {
      return this.numberWithCommas(p.toFixed(2));
    },
    fileHandler() {
      const files = this.$refs.myFiles.files;
      // console.log(files);
      this.processFiles(Array.from(files));
    },
    processFiles(files) {
      files.map(this.createActivityFromPDF);
    },
    async createActivityFromPDF(file) {
      let activities;
      var fileReader = new FileReader();
      fileReader.onload = async e => {
        activities = await extractActivities(e);

        const results = activities.map(activity => {
          const a = {
            ...activity,
            filename: file.name,
            parsed: true,
          };

          console.log(a);
          this.activities.push(a);
          return a;
        });

        console.log(results)
      };
      fileReader.readAsArrayBuffer(file);
      return activities;
    },
  },
});
