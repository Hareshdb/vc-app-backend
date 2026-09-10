export function getContributionCycleDates(
  mandalStartDate: Date | string | null | undefined,
  refDate: Date = new Date(),
) {
  let startDay = 15;
  if (mandalStartDate) {
    if (typeof mandalStartDate === 'string' && mandalStartDate.includes('-')) {
      const parts = mandalStartDate.split('T')[0].split('-');
      if (parts.length === 3) {
        const parsedDay = parseInt(parts[2], 10);
        if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
          startDay = parsedDay;
        }
      }
    } else {
      const startDate = new Date(mandalStartDate);
      if (!isNaN(startDate.getTime())) {
        startDay = startDate.getDate();
      }
    }
  }

  const ref = new Date(refDate);

  const year = ref.getFullYear();
  const month = ref.getMonth(); // 0-11
  const day = ref.getDate();

  let cycleStartYear = year;
  let cycleStartMonth = month;

  const maxDaysThisMonth = new Date(year, month + 1, 0).getDate();
  const effectiveStartDayThisMonth = Math.min(startDay, maxDaysThisMonth);

  if (day < effectiveStartDayThisMonth) {
    cycleStartMonth = month - 1;
    if (cycleStartMonth < 0) {
      cycleStartMonth = 11;
      cycleStartYear = year - 1;
    }
  }

  const maxDaysStartMonth = new Date(cycleStartYear, cycleStartMonth + 1, 0).getDate();
  const cycleStartDate = new Date(
    cycleStartYear,
    cycleStartMonth,
    Math.min(startDay, maxDaysStartMonth),
    0,
    0,
    0,
    0,
  );

  let cycleEndYear = cycleStartYear;
  let cycleEndMonth = cycleStartMonth + 1;
  if (cycleEndMonth > 11) {
    cycleEndMonth = 0;
    cycleEndYear = cycleStartYear + 1;
  }
  const maxDaysEndMonth = new Date(cycleEndYear, cycleEndMonth + 1, 0).getDate();
  const nextCycleStartDate = new Date(
    cycleEndYear,
    cycleEndMonth,
    Math.min(startDay, maxDaysEndMonth),
    0,
    0,
    0,
    0,
  );
  const cycleEndDate = new Date(nextCycleStartDate.getTime() - 1);

  return { cycleStartDate, cycleEndDate, nextCycleStartDate };
}

export function formatNextCycleText(nextCycleStartDate: Date): string {
  const day = String(nextCycleStartDate.getDate()).padStart(2, '0');
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthName = monthNames[nextCycleStartDate.getMonth()];
  const year = nextCycleStartDate.getFullYear();
  return `NEXT CYCLE: ${day} ${monthName} ${year}`;
}
