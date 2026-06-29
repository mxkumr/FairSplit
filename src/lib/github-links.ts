export const GITHUB_REPO = "https://github.com/mxkumr/FairSplit";

export const GITHUB_ISSUES = {
  all: `${GITHUB_REPO}/issues`,
  bugReport: `${GITHUB_REPO}/issues/new?template=bug_report.yml`,
  feedback: `${GITHUB_REPO}/issues/new?template=feedback.yml`,
} as const;
