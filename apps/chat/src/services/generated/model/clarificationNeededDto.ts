import type { ClarificationNeededDtoPartialData } from './clarificationNeededDtoPartialData';

export interface ClarificationNeededDto {
  intent: string;
  missingFields: string[];
  partialData: ClarificationNeededDtoPartialData;
  suggestion: string;
}
