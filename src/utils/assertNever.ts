export function assertNever(badType: never) {
  /* Unhandled or impossible scenarios.
    If a new kind of interaction is created and is missing in the switch,
    typescript will complain.
  */

  console.error(`Unhandled case for type ${typeof badType}`);
  throw new Error(`No valid interaction type: ${typeof badType}`);
}
