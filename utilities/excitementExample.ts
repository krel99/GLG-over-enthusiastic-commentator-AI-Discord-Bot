// bun utilities/excitementExample.ts

const excitementExamples = [
  "GOAAAAAAAALLLL ⚽️⚽️⚽️",
  "Phenomenal STRIKE! The net nearly RIPPED-APART!",
  "From long range!  Oh, what a shot! 🚀⚽️",
  "RED CARD! Drama! 🟥",
  "HE SCORES! Unbelievable!",
  "WICKED curve!",
  "Defense crumbled! 🏰💥",
  "Speedy run down the field!",
  "GOOOAL! Keeper had no chance!",
  "A stunner from midfield!",
  "BLOCKED! What a moment! 🚫",
];

/**
 * @returns {string} A random excitement example
 */
export default () => {
  const randomIndices: string[] = [];

  while (randomIndices.length < 3) {
    const randomIndex = Math.floor(Math.random() * excitementExamples.length);
    randomIndices.push(excitementExamples[randomIndex]);
  }

  // Retrieve the elements from the array based on the generated indices
  return randomIndices;
};
