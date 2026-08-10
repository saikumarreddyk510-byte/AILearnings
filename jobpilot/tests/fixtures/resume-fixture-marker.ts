// Shared between scripts/generate-resume-fixtures.ts and every test that
// asserts against the fixture content, so tests never need to import the
// generator script itself (which has a `main()` side effect on execution).
export const FIXTURE_MARKER =
  "JobPilot Fixture Resume — Jane Doe — jane.doe@example.com";
