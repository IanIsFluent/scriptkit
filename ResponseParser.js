// @ts-check
// todo: error handling
export class ResponseParser {
  constructor(responseBody) {
    this.responseBody = responseBody;
    this.includedData = this.makeIncludedDataMap();
  }

  makeIncludedDataMap() {
    return this.responseBody.included.reduce((acc, item) => {
      if (acc[item.type]) {
        acc[item.type][item.id] = item;
      } else {
        acc[item.type] = { [item.id]: item };
      }
      return acc;
    }, {});
  }

  /**
   *
   * @returns {{ id: string; date: string; approved: boolean; time: string; note: string; startedAt: string; stoppedAt: string; project: string; service: string; deal: string; }[]}
   */
  mapResponseToVM() {
    return this.responseBody.data.map((entry) => {
      // const person = mapPerson(getIncludedData(entry, 'person', 'people'));
      const serviceData = this.getIncludedData(entry, 'service', 'services');
      const project = mapToName(
        this.getIncludedData(serviceData, 'project', 'projects')
      );
      const deal = mapToName(
        this.getIncludedData(serviceData, 'deal', 'deals')
      );
      const service = mapToName(serviceData);

      const vm = {
        id: entry.id,
        date: entry.attributes.date,
        approved: entry.attributes.approved,
        time: entry.attributes.time,
        note: entry.attributes.note,
        startedAt: entry.attributes.timer_started_at,
        stoppedAt: entry.attributes.timer_stopped_at,
        project,
        service,
        deal,
      };
      return vm;
    });
  }

  /**
   * @param {{ relationships: { [x: string]: { data: { id: string | number; }; }; }; }} item
   * @param {string} relSingular
   * @param {string} relPlural
   */
  getIncludedData(item, relSingular, relPlural) {
    if (item.relationships?.[relSingular]?.data?.id) {
      return this.includedData[relPlural][
        item.relationships[relSingular].data.id
      ];
    }
  }
}
function mapPerson(person) {
  return `${person.attributes.first_name} ${person.attributes.last_name}`;
}
function mapToName(service) {
  return service?.attributes?.name;
}
