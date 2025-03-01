export interface CommissionStage {
  title: string;
  date: string;
  description: string;
  image: string;
}

export interface Commission {
  id: string;
  title: string;
  year: string;
  category: string;
  description: string;
  image: string;
  stages: CommissionStage[];
}