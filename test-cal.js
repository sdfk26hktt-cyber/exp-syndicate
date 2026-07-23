const approvedEvents = [
  { id: 1, title: 'Event Today', date: '2026-06-09', time: '10:00' },
  { id: 2, title: 'Event Next Week', date: '2026-06-15', time: '12:00' }
];

const getEventsForDateObj = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const d = dateObj.getDate();
    const dayEvts = approvedEvents.filter(evt => {
      if (!evt.date || !evt.date.includes('-')) return false;
      const [evY, evM, evD] = evt.date.split('-');
      const eDate = new Date(evY, evM - 1, evD);
      return eDate.getFullYear() === y && eDate.getMonth() === m && eDate.getDate() === d;
    });
    return dayEvts.sort((a, b) => a.time.localeCompare(b.time));
};

let currentDate = new Date('2026-06-09T12:00:00');
let daysToShow = [];
const start = new Date(currentDate);
start.setDate(start.getDate() - start.getDay()); // go to Sunday
for (let i = 0; i < 7; i++) {
  const d = new Date(start);
  d.setDate(d.getDate() + i);
  daysToShow.push(d);
}

let foundEvents = 0;
daysToShow.forEach(d => {
  const evts = getEventsForDateObj(d);
  if (evts.length > 0) {
    foundEvents += evts.length;
    console.log(`Found ${evts.length} events on ${d.toDateString()}`);
  }
});
console.log(`Total events found in week: ${foundEvents}`);
