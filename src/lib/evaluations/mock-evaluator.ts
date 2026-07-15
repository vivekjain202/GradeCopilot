export type RubricDraftInput = {
  id: string;
  label: string;
  maxMarks: number;
  criteria: string;
};

export function createDeterministicDraft(questions: RubricDraftInput[]) {
  return questions.map((question) => ({
    rubricQuestionId: question.id,
    earnedMarksSuggested: 0,
    earnedMarksFinal: 0,
    rationale: "Awaiting teacher review of the submitted answer.",
    answerContentJson: { type: "doc", content: [] },
    comment: `Review ${question.label} against: ${question.criteria}`,
  }));
}
