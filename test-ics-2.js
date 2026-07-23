import * as ics from 'ics';

const events = [{
  title: 'Test',
  start: [2024, 7, 21, 10, 0],
  startInputType: 'local',
  startOutputType: 'local',
  duration: { hours: 1, minutes: 0 },
  uid: 'test@expsyndicate.com'
}];

const { error, value } = ics.createEvents(events);
console.log(value);
