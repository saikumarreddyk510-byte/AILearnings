/**
 * The exact sentence spec section G requires the user to confirm before
 * final approval. Single source of truth — imported by both the review
 * UI's checkbox label and the server-side approval guard (which rejects
 * unless the submitted text matches this exactly), so a bypassed/broken
 * client cannot approve without literally supplying this sentence.
 */
export const REQUIRED_CONFIRMATION_TEXT =
  "I reviewed this application and confirm that all information is accurate.";
