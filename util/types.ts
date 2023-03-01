export type Meeting = {
  id: string;
  title: string;
  timezone: string;
  dates: string[];
  earliest: number;
  latest: number;
};

export type Respondent = {
  name: string;
  availability: number[];
  id: string;
};
