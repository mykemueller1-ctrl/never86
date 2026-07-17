export type ShiftStation = {
  name: string;
  net: number;
  voids: number;
  voidRate: number;
  stationMedianVoidRate: number;
  flagged: boolean;
};

export type ShiftCrew = {
  name: string;
  role: string;
  station: string;
  covers: number;
  net: number;
  voidRate: number;
  achievementCount: number;
  streakDays: number;
};

export type ShiftPulse = {
  store: string;
  shift: string;
  startedAt: string;
  forecastCovers: number;
  actualCovers: number;
  forecastNet: number;
  actualNet: number;
  shiftGoalLabel: string;
  shiftGoalTarget: number;
  shiftGoalActual: number;
  voidMedian: number;
  topAchievements: { name: string; crew: string; description: string }[];
  stations: ShiftStation[];
  crew: ShiftCrew[];
};
