// Attempting a more direct global JSX namespace augmentation for fbt

declare namespace JSX {
  interface IntrinsicElements {
    fbt: any;
    'fbt:param': any;
    // If other fbt elements like fbt:pronoun are used, they'd need to be added here too.
  }
}
